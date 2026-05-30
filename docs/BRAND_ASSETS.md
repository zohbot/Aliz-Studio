# Brand Assets

## Current Files

The app references normalized copies of the generated Aliz Studio brand exports:

- `public/brand/aliz-studio-logo-dark.png` - full generated black signature logo for light or glass surfaces.
- `public/brand/aliz-studio-logo-light.png` - full generated white signature logo for dark surfaces.
- `public/brand/aliz-mark-dark.png` - compact generated mark for app icons and tight UI.
- `public/brand/aliz-mark-light.png` - alternate compact generated mark.
- `public/icons/icon-192.png` - 192x192 PWA icon.
- `public/icons/icon-512.png` - 512x512 PWA icon.
- `public/icons/apple-touch-icon.png` - 180x180 Apple touch icon.
- `app/icon.svg` - Next.js app icon/fav icon source.

SVG fallback placeholders also exist in `public/brand` for future vector replacement, but the current UI uses the generated PNG exports.

## Source Exports

Original generated source exports are archived with clean names under `public/brand/source/`.

- `public/brand/source/aliz-studio-source-01.png` through `aliz-studio-source-08.png`
- `public/brand/source/aliz-mark-source-01.png` through `aliz-mark-source-06.png`

These files are reference/source art only. The app should not import or render them directly.

## Usage

- Use the full `Aliz Studio` signature logo when the available width keeps the wordmark readable.
- Use the compact `Aliz` mark for favicon, app icon, mobile/tight header states, and small decorative brand contexts.
- Keep dark assets on light or glass surfaces.
- Keep light assets on dark surfaces.
- Do not reference files from metadata or the manifest unless the files exist in the repo.

## Replacement Contract

Future production brand exports can replace the normalized files in place if the filenames remain stable. Preferred replacement dimensions:

- Full signature logo: PNG or SVG, wide transparent/signature crop preferred.
- Compact mark: PNG or SVG, square crop preferred.
- PWA icon: PNG, 192x192.
- PWA icon: PNG, 512x512.
- Apple touch icon: PNG, 180x180.

## Metadata And Manifest

- `app/layout.tsx` declares favicon, 192px, 512px, and Apple touch icon metadata.
- `app/manifest.ts` declares the installable app manifest with `name`, `short_name`, colors, display mode, and 192/512 icons.

This pass does not add an aggressive service worker or offline caching.
