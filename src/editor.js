import { hasBlockSupport } from '@wordpress/blocks';
import { InspectorControls, useSettings } from '@wordpress/block-editor';
import {
	CustomSelectControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import TokenList from '@wordpress/token-list';

/**
 * Extend blocks that support typography with a custom typographyPreset
 * attribute and hide the default font size control when it is the only
 * control WordPress would otherwise show.
 *
 * @param {Object} settings Original block settings.
 * @return {Object} Filtered block settings.
 */
function addAttribute( settings ) {
	if ( ! hasBlockSupport( settings, 'typography' ) ) {
		return settings;
	}

	if ( ! settings.attributes.typographyPreset ) {
		settings.attributes.typographyPreset = {
			type: 'string',
		};
	}

	if (
		settings.supports.typography?.__experimentalDefaultControls &&
		Object.keys( settings.supports.typography.__experimentalDefaultControls )
			.length === 1 &&
		settings.supports.typography.__experimentalDefaultControls.fontSize
	) {
		settings.supports.typography.__experimentalDefaultControls = {};
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'typography-presets-demo/add-attribute',
	addAttribute
);

/**
 * Add the preset class to the editor wrapper so preset styles are visible
 * immediately while editing.
 *
 * @param {Function} BlockListBlock Original block list component.
 * @return {Function} Wrapped block list component.
 */
const withPresetClass = createHigherOrderComponent(
	( BlockListBlock ) => ( props ) => {
		if ( ! hasBlockSupport( props.name, 'typography' ) ) {
			return <BlockListBlock { ...props } />;
		}

		if ( ! props.attributes.typographyPreset ) {
			return <BlockListBlock { ...props } />;
		}

		const classes = new TokenList( props.attributes.className );
		classes.add(
			`has-${ props.attributes.typographyPreset }-typography-preset`
		);

		return <BlockListBlock { ...props } className={ classes.value } />;
	},
	'withPresetClass'
);

addFilter(
	'editor.BlockListBlock',
	'typography-presets-demo/with-preset-class',
	withPresetClass
);

/**
 * Add the preset class to static block markup during save.
 *
 * Dynamic blocks receive classes through block supports on the PHP side,
 * but static blocks need the class injected into their saved markup.
 *
 * @param {Object} extraProps Existing save props.
 * @param {Object} blockType  Block type settings.
 * @param {Object} attributes Block attributes.
 * @return {Object} Filtered save props.
 */
function addSaveProps( extraProps, blockType, attributes ) {
	if ( ! hasBlockSupport( blockType, 'typography' ) ) {
		return extraProps;
	}

	if ( ! attributes?.typographyPreset || attributes.typographyPreset === 'default' ) {
		return extraProps;
	}

	const classes = new TokenList( extraProps.className );
	classes.add( `has-${ attributes.typographyPreset }-typography-preset` );

	extraProps.className = classes.value || undefined;

	return extraProps;
}

addFilter(
	'blocks.getSaveContent.extraProps',
	'typography-presets-demo/add-save-props',
	addSaveProps
);

/**
 * Render the Typography panel control used to select a preset.
 *
 * The preset options come directly from `settings.custom.typographyPreset`
 * in theme.json, and the style object on each option lets the select control
 * preview the typography visually.
 *
 * @param {Object} props Component props.
 * @param {string} props.clientId Block client ID.
 * @param {Object} props.attributes Block attributes.
 * @param {Function} props.setAttributes Setter for block attributes.
 * @return {JSX.Element|null} Typography preset control.
 */
function TypographyPresetControl( { clientId, attributes, setAttributes } ) {
	const [ custom ] = useSettings( 'custom' );
	const { typographyPreset: presets } = custom ?? {};

	if ( ! presets ) {
		return null;
	}

	const options = [
		{
			key: 'default',
			name: __( 'Default', 'typography-presets-demo' ),
		},
		...Object.entries( presets ).map( ( [ slug, { name, style } ] ) => ( {
			key: slug,
			name,
			style,
		} ) ),
	];

	const selectedOption =
		options.find( ( option ) => option.key === attributes.typographyPreset ) ||
		options[ 0 ];

	return (
		<InspectorControls group="typography">
			<ToolsPanelItem
				label={ __( 'Preset', 'typography-presets-demo' ) }
				hasValue={ () => !! attributes.typographyPreset }
				onDeselect={ () => setAttributes( { typographyPreset: undefined } ) }
				resetAllFilter={ () => ( { typographyPreset: undefined } ) }
				panelId={ clientId }
				isShownByDefault
			>
				<CustomSelectControl
					label={ __( 'Preset', 'typography-presets-demo' ) }
					value={ selectedOption }
					options={ options }
					onChange={ ( { selectedItem } ) =>
						setAttributes( { typographyPreset: selectedItem.key } )
					}
					__next40pxDefaultSize
				/>
			</ToolsPanelItem>
		</InspectorControls>
	);
}

/**
 * Inject the preset control into the built-in Typography inspector group for
 * blocks that already support typography.
 *
 * @param {Function} BlockEdit Original block edit component.
 * @return {Function} Wrapped block edit component.
 */
const withPresetControl = createHigherOrderComponent( ( BlockEdit ) => {
	return ( props ) => {
		if ( ! hasBlockSupport( props.name, 'typography' ) ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<>
				<BlockEdit { ...props } />
				<TypographyPresetControl { ...props } />
			</>
		);
	};
}, 'withPresetControl' );

addFilter(
	'editor.BlockEdit',
	'typography-presets-demo/add-preset-control',
	withPresetControl
);
