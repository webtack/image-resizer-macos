# Release (build and distribution)

The build is neither signed nor notarized (there is no Apple Developer account, and the Mac App Store
is not used). The artifacts are `.dmg` and `.zip` files for Apple Silicon (arm64) and Intel (x64).

## 1. Bump the version

```bash
npm version patch   # or minor / major; changes "version" in package.json
```

The version ends up in file names: `Image Resizer-<version>-arm64.dmg` and so on.

## 2. Prepare dependencies (once)

`sharp` has separate native binaries for each architecture. To build the x64 version on Apple Silicon
(and vice versa), install the binaries for both platforms:

```bash
npm install --os=darwin --cpu=x64 sharp --legacy-peer-deps
npm install --os=darwin --cpu=arm64 sharp --legacy-peer-deps
```

The `--legacy-peer-deps` flag is needed because in this environment `npm` sometimes fails without it
with `Cannot read properties of null (reading 'edgesOut')`.

## 3. Build

```bash
npm test          # make sure all tests pass
npm run dist      # tsc + electron-builder
```

The output is in the `release/` folder (it is in `.gitignore`):

| File | Architecture |
| --- | --- |
| `Image Resizer-<version>-arm64.dmg`, `Image Resizer-<version>-arm64-mac.zip` | Apple Silicon |
| `Image Resizer-<version>.dmg`, `Image Resizer-<version>-mac.zip` | Intel |

Build settings live in the `build` field of `package.json`: `mac.identity: null` (no signing), `sharp`
and `@img/*` in `asarUnpack` (native modules cannot be read from `app.asar`), icon `build/icon.icns`.
The icon can be regenerated with `node scripts/make-icon.mjs`.

## 4. Verify the built app

1. Make sure `sharp` is unpacked: `release/mac-arm64/Image Resizer.app/Contents/Resources/app.asar.unpacked/node_modules/@img/` must contain `sharp-darwin-arm64` and `sharp-libvips-darwin-arm64`.
2. Launch the package as a regular `.app` and look at the window:

   ```bash
   open -n "release/mac-arm64/Image Resizer.app"
   ```

3. Process a fixture folder with HEIC files: select it in the app and click Run. `<name>_<W>x<H>.jpg`
   files should appear, including ones for `.heic`.

## 5. First launch on another Mac (Gatekeeper)

macOS blocks a downloaded unsigned app. The user has to:

1. Open the `.dmg` and drag **Image Resizer** into `Applications` (for a `.zip`, unzip it).
2. Right-click the app → **Open** → **Open** (once is enough).

If macOS still refuses, remove the quarantine attribute:

```bash
xattr -cr "/Applications/Image Resizer.app"
```

## 6. Distribution

Send the `.dmg` (or `.zip`) for the right architecture — via GitHub Releases, cloud storage or a
messenger — together with a reminder about step 5. To find out a Mac's architecture: Apple menu →
**About This Mac** (Apple M… = arm64, Intel = x64).
