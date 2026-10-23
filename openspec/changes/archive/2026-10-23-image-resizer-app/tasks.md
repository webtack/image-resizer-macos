# Tasks

## 1. Project scaffold

- [x] 1.1 Initialise the npm project with TypeScript (strict), Vitest under `src/core`, `src/main`, `src/preload`, `src/renderer`; verify `npm test` passes on a smoke test and `npm run build` compiles
- [x] 1.2 Add Electron and a minimal main/preload/renderer that opens a window; verify `npm start` shows the window and `contextIsolation` is on
- [x] 1.3 Add `.gitignore` (`node_modules/`, `dist/`, `release/`, `.DS_Store`) and a short README with install/run/test commands; verify commands run as written
- [x] 1.4 Create `docs/` with `docs/README.md` (Ukrainian: призначення програми, структура документації, встановлення, запуск і тести); verify the listed commands run as written

## 2. Size presets

- [x] 2.1 Implement `SizePreset` type with validation (name non-empty/unique, 1–16384 px) and verify unit tests cover invalid size and duplicate name
- [x] 2.2 Implement `PresetStore` (JSON in a given directory, default four presets on first launch, selected-preset persistence, auto-reselect on delete) and verify tests for first launch, reload round-trip and deleting the selected preset
- [x] 2.3 Build preset picker and "Manage presets" dialog (add/edit/delete with inline validation messages); verify manually that presets persist across app restart
- [x] 2.4 Write `docs/presets.md` (Ukrainian: як створювати, редагувати й видаляти пресети, стартові пресети, де зберігаються); verify every described step matches the UI

## 3. Smart fit

- [x] 3.1 Implement fit/cover geometry calculation and verify unit tests: 4000×3000→1080×1350 gives 1080×810 centred, matching aspect gives no margins, tiny source upscales
- [x] 3.2 Implement image loading with EXIF orientation applied and HEIC conversion via `sips`; verify tests with an EXIF-rotated fixture yielding upright dimensions and a HEIC fixture decoding
- [x] 3.3 Implement the renderer: blurred cover background + sharp fitted photo on an opaque sRGB W×H canvas; verify tests that output size is exact, corner pixels of margins are non-transparent and differ from flat black, and a transparent PNG composites over the blur
- [x] 3.4 Visually check results on landscape, portrait, panorama and small fixtures (saved under a scratch dir) and tune the blur sigma; record the chosen value in design.md
- [x] 3.5 Write `docs/smart-fit.md` (Ukrainian: як працює вписування за більшою стороною і розмитий фон, обраний радіус, приклади до/після); verify the examples match actual output

## 4. Batch processing

- [x] 4.1 Implement image discovery (supported extensions, optional recursion, exclusion of prior outputs) and verify tests for mixed files, subfolders on/off and skipped previous outputs
- [x] 4.2 Implement output naming, collision counter and atomic temp-file write; verify tests for normal name, collision, and that originals are untouched
- [x] 4.3 Implement JPEG/PNG/keep-original encoder with quality and fallback; verify tests for PNG→JPEG at quality 80 and HEIC→JPEG fallback
- [x] 4.4 Implement the batch runner with bounded concurrency, per-file result, cancellation and failure isolation; verify tests with a corrupt file (9 ok, 1 failed) and cancel mid-run keeping finished outputs
- [x] 4.5 Map permission write errors to a per-file "cannot write to folder" failure and verify a test with a read-only folder marks files failed without crashing and the batch continues
- [x] 4.6 Write `docs/batch.md` (Ukrainian: пошук зображень, іменування файлів `<name>_<W>x<H>`, формати й якість, помилки та скасування); verify the naming examples match real output

## 5. User interface

- [x] 5.1 Build the main window: folder picker/drop target, image count and list, include-subfolders toggle, "no images found" state; verify manually with a folder of mixed files
- [x] 5.2 Add format/quality controls and Run/Cancel with progress bar, per-file status and final summary; verify Run is disabled without folder/images/preset and enabled otherwise
- [x] 5.3 Wire the UI to `src/core` over IPC with folder picker and folder drag-and-drop, and verify end-to-end that a real folder produces `<name>_<W>x<H>.jpg` files beside the originals
- [x] 5.4 Confirm no network use: verify there are no network calls in the code, the CSP is `default-src 'self'`, and the app works with Wi-Fi off
- [x] 5.5 Write `docs/usage.md` (Ukrainian: покроковий посібник користувача — обрати папку, пресет, формат, запустити; типові помилки); verify by following it from scratch on a clean test folder

## 6. Verification

- [x] 6.1 Run a 50+ photo batch including HEIC, PNG with alpha and a rotated JPEG; verify no crash, memory stays reasonable, all spec scenarios behave as written, and `npm test` passes

## 7. Packaging

- [x] 7.1 Create the app icon (`.icns`) and configure electron-builder for unsigned `.dmg` and `.zip` (arm64 + x64) with `sharp` in `asarUnpack`; verify `npm run dist` produces both files
- [x] 7.2 Smoke-test the packaged app: open the built `.app` (right-click → Open) and process a fixture folder including a HEIC; verify outputs are created
- [x] 7.3 Write `docs/release.md` (Ukrainian: як підняти версію, зібрати `.dmg`/`.zip`, обійти Gatekeeper при першому запуску, поширити); verify each step against the steps actually performed in 7.1–7.2
