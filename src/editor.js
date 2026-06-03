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
	// Sometimes undefined.
	const settings = useSettings( [ 'custom' ] );
	console.log( { settings } );
	const [ { typographyPreset: presets } ] = settings ?? [];

	// Working code.
	// const [ settings ] = useSettings( 'custom' );
	// console.log( { settings } );
	// const { typographyPreset: presets } = settings ?? {};

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
			<CustomSelectControl
				label={ __( 'Preset', 'typography-presets-demo' ) }
				options={ options }
				__next40pxDefaultSize
			/>
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
