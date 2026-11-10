# Proposal

## Why

The README and `docs/` describe the app and the smart-fit result only in text. A visitor cannot see
what the window looks like or what "a blurred copy fills the margins" produces without installing
the app. A screenshot and a before/after example make the value clear at a glance.

## What Changes

- Add `docs/images/` with three files: an app screenshot, a "before" photo and an "after" photo
  (the "after" is produced by the app itself with the 1080×1350 preset).
- Show the screenshot and the before/after pair in `README.md`.
- Show the screenshot in `docs/usage.md` near the step-by-step guide.
- Show the before/after pair in `docs/smart-fit.md` near "How it works".
- Add an attribution and license note for the sample photo (Unsplash License, author and source
  link) in `docs/README.md`.
- No application behavior, UI, presets, build or release steps change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a docs-only change, so the change sets `skip_specs: true`.

## Impact

- Files: `README.md`, `docs/README.md`, `docs/usage.md`, `docs/smart-fit.md`, new `docs/images/*`.
- Repository size grows by a few hundred KB; images are compressed to stay small.
- The packaged app is unaffected: `electron-builder` ships only `dist/**/*` and `package.json`.
- Non-goals: automated screenshot tooling, localized screenshots, an interactive slider.
