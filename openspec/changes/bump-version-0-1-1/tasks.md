# Tasks

## 1. Version bump

- [x] 1.1 Run `npm version 0.1.1 --no-git-tag-version` and verify `"version": "0.1.1"` in `package.json` and in both version fields at the top of `package-lock.json` (`grep -n '"version"' package-lock.json | head -3`)
- [x] 1.2 Search the repo (excluding `node_modules`, `release`, `dist`, `.git`, `package-lock.json`) for hard-coded `0.1.0` and update any hits in `docs/` in Ukrainian; verify the same search returns no stale references

## 2. Rebuild and verify

- [ ] 2.1 Run `npm test` and verify all Vitest suites pass
- [ ] 2.2 Run `npm run dist` and verify `release/` contains `Image Resizer-0.1.1-arm64.dmg`, `Image Resizer-0.1.1-arm64-mac.zip`, `Image Resizer-0.1.1.dmg` and `Image Resizer-0.1.1-mac.zip`
- [ ] 2.3 Verify the packaged app reports `0.1.1`: `defaults read "release/mac-arm64/Image Resizer.app/Contents/Info.plist" CFBundleShortVersionString` prints `0.1.1`
