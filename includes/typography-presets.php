<?php
/**
 * Typography preset support.
 *
 * @package TypographyPresetsDemo
 */

declare( strict_types=1 );

namespace TypographyPresetsDemo\TypographyPresets;

use WP_Block_Supports;
use WP_Block_Type;

add_action( 'enqueue_block_assets', __NAMESPACE__ . '\\enqueue_preset_styles' );

WP_Block_Supports::get_instance()->register(
	'typographyPresets',
	[
		'register_attribute' => __NAMESPACE__ . '\\register_attribute',
		'apply'              => __NAMESPACE__ . '\\apply',
	]
);

/**
 * Enqueue generated typography preset styles.
 */
function enqueue_preset_styles(): void {
	$presets  = wp_get_global_settings( [ 'custom', 'typographyPreset' ] );
	$defaults = wp_get_global_settings( [ 'custom', 'defaultTypographyPreset' ] );

	if ( empty( $presets ) || ! is_array( $presets ) ) {
		return;
	}

	$style_properties = [
		'fontSize'       => 'font-size',
		'fontFamily'     => 'font-family',
		'fontStyle'      => 'font-style',
		'fontWeight'     => 'font-weight',
		'lineHeight'     => 'line-height',
		'letterSpacing'  => 'letter-spacing',
		'textDecoration' => 'text-decoration',
		'textTransform'  => 'text-transform',
	];

	$preset_styles = [];

	foreach ( $presets as $slug => $preset ) {
		$preset_styles[ $slug ] = [
			'selectors' => [],
			'styles'    => '',
		];

		if ( empty( $preset['style'] ) || ! is_array( $preset['style'] ) ) {
			continue;
		}

		foreach ( $preset['style'] as $style_name => $style_value ) {
			if ( ! isset( $style_properties[ $style_name ] ) ) {
				continue;
			}

			$property = '--wp--custom--typography-preset--' . $slug . '--style--' . _wp_to_kebab_case( $style_name );
			$property = preg_replace( '/(\d)(\w)/', '$1-$2', $property );

			$preset_styles[ $slug ]['styles'] .= sprintf(
				"\t%s: var(%s);\n",
				$style_properties[ $style_name ],
				$property
			);
		}
	}

	collect_preset_selectors( $preset_styles, $defaults );

	$stylesheet = '';

	foreach ( $preset_styles as $slug => $preset ) {
		if ( empty( $preset['styles'] ) ) {
			continue;
		}

		$selector = '.has-' . $slug . '-typography-preset';
		if ( ! empty( $preset['selectors'] ) ) {
			$selector .= ', ' . implode( ', ', $preset['selectors'] );
		}

		$stylesheet .= $selector . " {\n";
		$stylesheet .= $preset['styles'];
		$stylesheet .= "}\n\n";
	}

	if ( '' === $stylesheet ) {
		return;
	}

	wp_register_style( 'typography-presets-demo', false, [], md5( $stylesheet ) );
	wp_add_inline_style( 'typography-presets-demo', $stylesheet );
	wp_enqueue_style( 'typography-presets-demo' );
}

/**
 * Collect selectors for preset defaults.
 *
 * @param array       $preset_styles Preset styles keyed by slug.
 * @param array       $settings      Default preset settings.
 * @param string|null $block_name    Optional block name.
 */
function collect_preset_selectors( array &$preset_styles, array $settings, ?string $block_name = null ): void {
	if ( ! empty( $settings['elements'] ) ) {
		collect_element_selectors( $preset_styles, $settings['elements'], $block_name );
	}

	if ( null !== $block_name || empty( $settings['blocks'] ) ) {
		return;
	}

	foreach ( $settings['blocks'] as $current_block_name => $block_settings ) {
		if ( is_string( $block_settings ) ) {
			$block_settings = [ 'preset' => $block_settings ];
		}

		if ( ! empty( $block_settings['preset'] ) && isset( $preset_styles[ $block_settings['preset'] ] ) ) {
			$preset_styles[ $block_settings['preset'] ]['selectors'][] = block_name_to_selector( $current_block_name );
		}

		if ( ! empty( $block_settings['elements'] ) ) {
			collect_element_selectors( $preset_styles, $block_settings['elements'], $current_block_name );
		}
	}
}

/**
 * Collect selectors for element presets.
 *
 * @param array       $preset_styles    Preset styles keyed by slug.
 * @param array       $element_settings Element settings.
 * @param string|null $block_name       Optional block name.
 */
function collect_element_selectors( array &$preset_styles, array $element_settings, ?string $block_name = null ): void {
	foreach ( $element_settings as $element => $preset ) {
		if ( ! is_string( $preset ) || ! isset( $preset_styles[ $preset ] ) ) {
			continue;
		}

		$parent_selector = $block_name ? block_name_to_selector( $block_name ) : '';

		$element_selector = match ( $element ) {
			'button' => '.wp-element-button, .wp-block-button__link',
			'caption' => '.wp-element-caption, figcaption',
			'link' => 'a',
			default => $element,
		};

		$selector = trim( $parent_selector . ' :where(' . $element_selector . ')' );
		$preset_styles[ $preset ]['selectors'][] = $selector;
	}
}

/**
 * Convert a block name to the front-end class selector used by core.
 *
 * @param string $block_name Block name in namespace/block format.
 * @return string
 */
function block_name_to_selector( string $block_name ): string {
	return '.wp-block-' . _wp_to_kebab_case( str_replace( 'core/', '', $block_name ) );
}

/**
 * Register the custom block attribute.
 *
 * @param WP_Block_Type $block_type Block type.
 */
function register_attribute( $block_type ): void {
	if ( ! ( $block_type instanceof WP_Block_Type ) ) {
		return;
	}

	if ( empty( $block_type->supports['typography'] ) ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = [];
	}

	if ( ! array_key_exists( 'typographyPreset', $block_type->attributes ) ) {
		$block_type->attributes['typographyPreset'] = [
			'type' => 'string',
		];
	}
}

/**
 * Apply preset classes to dynamic blocks.
 *
 * @param WP_Block_Type $block_type        Block type.
 * @param array         $block_attributes  Block attributes.
 * @return array<string, string>
 */
function apply( $block_type, array $block_attributes = [] ): array {
	if ( ! ( $block_type instanceof WP_Block_Type ) ) {
		return [];
	}

	if ( empty( $block_type->supports['typography'] ) ) {
		return [];
	}

	if ( wp_should_skip_block_supports_serialization( $block_type, 'typography' ) ) {
		return [];
	}

	if ( empty( $block_attributes['typographyPreset'] ) || 'default' === $block_attributes['typographyPreset'] ) {
		return [];
	}

	return [
		'class' => 'has-' . $block_attributes['typographyPreset'] . '-typography-preset',
	];
}
