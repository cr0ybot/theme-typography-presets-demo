# useSettings Repro

Minimal reproduction for [WordPress/gutenberg#78888](https://github.com/WordPress/gutenberg/issues/78888).

## The Issue

In WordPress 7.0, `useSettings()` from `@wordpress/block-editor` sometimes returns `[undefined]` when called with an **array argument** inside a `BlockEdit` HOC context:

```js
// Unsafe — throws if useSettings hasn't resolved yet:
const [ { typographyPreset: presets } ] = useSettings( [ 'custom' ] );
// TypeError: ...[Symbol.iterator]().next().value is undefined
```

This can be considered user error, since `useSettings()` is an asynchronous hook that may return `undefined` on the initial render before it resolves.

However, this pattern was working reliably in previous versions of WordPress. In WordPress 7.0, `useSettings` appears to return `undefined` on the first render more often (or exclusively) when called with an **array argument** inside a `BlockEdit` HOC context, making the crash consistently reproducible where it wasn't before.

The Gutenberg plugin v23.2.2 seems to somehow restore the previous behavior.

## Workaround

Use the string argument form with a null guard:

```js
const [ custom ] = useSettings( 'custom' );
const { typographyPreset: presets } = custom ?? {};
```

Or read from `getEditorSettings().__experimentalFeatures` directly via `useSelect`:

```js
const custom = useSelect( ( select ) => {
    return select( 'core/editor' ).getEditorSettings()
        ?.__experimentalFeatures?.custom;
}, [] );
```

## Setup

The build files have been included, so you should be able to just download the repo zip and install it as a theme. If you want to make code changes, run the following commands to set up the build environment:

```sh
npm install
npm run build
```

Activate the theme in WordPress 7.0 (**without** the Gutenberg plugin), then open any post or page in the block editor. The previously working code should cause all blocks to encounter an error.
