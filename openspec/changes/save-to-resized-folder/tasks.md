# Tasks

## 1. Output location

- [x] 1.1 In `src/core/output.ts` add an exported `OUTPUT_FOLDER_NAME = 'resized'` (TSDoc with example) and make `writeOutput` create `<base>/resized` for a given base folder (`mkdir` recursive) and write the temp file and final link there; update its doc comment and example. Verify with `npm test` that `output.test.ts` covers: folder created on demand, base folder independent of the source folder, collision counter inside `resized`, original untouched, read-only folder still yields `WriteFolderError`.
- [x] 1.2 Add `outputMode` (`'each' | 'single'`, default `'each'`) and `outputRoot` to `BatchOptions`/`processFile` in `src/core/batch.ts` and update doc comments; verify `batch.test.ts` covers both modes, a nested folder, and a same-name collision in `single` mode.
- [x] 1.3 Add `outputMode` to `RunOptions` in `src/shared/api.ts`, pass it with `selectedFolder` as `outputRoot` in `src/main/ipc.ts`, and add the "Save subfolder results" select (disabled unless "Include subfolders" is on) in `src/renderer/index.html` and `renderer.ts`; verify with `npm run build` and by hand that the select toggles with the checkbox and the chosen mode is sent on Run.

## 2. Discovery

- [x] 2.1 In `src/core/discovery.ts` skip directories named `resized` (case-insensitive) during the walk and document it in TSDoc. Verify with new cases in `discovery.test.ts`: images inside `resized` are ignored with and without `recursive`, other subfolders still scanned.

## 3. Documentation and check

- [x] 3.1 Update `docs/batch.md` (section "Іменування результатів" and discovery rules) and `docs/usage.md` in Ukrainian to describe the `resized` folder, the "Save subfolder results" option with both modes (default: each folder has its own `resized`) and the skipped `resized` folder; verify no doc still says results are saved in the same folder.
- [x] 3.2 Run `npm test` and `npm run build`, then `npm start`, process a small folder and verify the outputs appear in `resized/` and a second run finds no new sources.
