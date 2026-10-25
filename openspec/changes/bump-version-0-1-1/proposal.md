# Proposal

## Why

The release build in `release/` was stale and had to be rebuilt to include the "save results into a `resized` subfolder" change. The rebuilt artifacts still carry version `0.1.0`, so they overwrite the old files under identical names and cannot be told apart from the previously distributed build. A new version number makes the updated build identifiable.

## What Changes

- Bump the application version from `0.1.0` to `0.1.1` in `package.json` and `package-lock.json`.
- Rebuild the release artifacts so file names carry `0.1.1` (`Image Resizer-0.1.1-arm64.dmg`, `Image Resizer-0.1.1-arm64-mac.zip`, `Image Resizer-0.1.1.dmg`, `Image Resizer-0.1.1-mac.zip`).
- Check `docs/` for hard-coded `0.1.0` references and update them in Ukrainian; `docs/release.md` already describes versioning with the `<версія>` placeholder.

No user-visible behavior changes, so no spec deltas.

## Capabilities

### New Capabilities
<!-- None: this is a release/versioning change only. -->

### Modified Capabilities
<!-- None: no requirement changes. The change sets `skip_specs: true`. -->

## Impact

- `package.json` and `package-lock.json`: `version` field only.
- `release/` (git-ignored): new `0.1.1` artifacts; old `0.1.0` files are left in place and can be removed manually.
- `src/` is untouched: the version is not hard-coded in code (`src/core/version.ts` only exports `APP_NAME`).
- `docs/`: only if stale `0.1.0` references are found.
