<?php
/**
 * Theme bootstrap.
 *
 * @package TypographyPresetsDemo
 */

declare( strict_types=1 );

add_action(
	'enqueue_block_editor_assets',
	static function (): void {
		$asset_file = __DIR__ . '/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'typography-presets-demo-editor',
			get_theme_file_uri( 'build/index.js' ),
			$asset['dependencies'],
			$asset['version'],
			true
		);
	}
);
