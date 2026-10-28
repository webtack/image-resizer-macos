import { BrowserWindow, dialog, ipcMain } from 'electron';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { runBatch } from '../core/batch';
import { discoverImages } from '../core/discovery';
import { PresetStore, PresetValidationError, type PresetInput } from '../core/presets';
import type { BatchSummary, ImageListing, PresetResult, PresetState, RunOptions } from '../shared/api';

/**
 * Registers all IPC handlers.
 *
 * Security model: the main process keeps the single "selected folder" (set only by the folder
 * picker or a folder drop) and discovers files itself on every scan/run, so the renderer can never
 * make the app read or write outside that folder.
 *
 * @example
 * registerIpc(() => mainWindow, await PresetStore.open(app.getPath('userData')));
 */
export function registerIpc(getWindow: () => BrowserWindow | null, store: PresetStore): void {
  let selectedFolder: string | null = null;
  let running: AbortController | null = null;

  const presetState = (): PresetState => ({ presets: store.list(), selectedId: store.selected()?.id ?? null });

  /** Runs a preset mutation and converts validation errors into a result the UI can show inline. */
  async function mutate(action: () => Promise<unknown>): Promise<PresetResult> {
    try {
      await action();
      return { ok: true, state: presetState() };
    } catch (err) {
      if (err instanceof PresetValidationError) return { ok: false, errors: err.errors };
      throw err;
    }
  }

  ipcMain.handle('folder:pick', async (): Promise<string | null> => {
    const win = getWindow();
    const options = { properties: ['openDirectory' as const], title: 'Choose a folder with images' };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return null;
    selectedFolder = result.filePaths[0];
    return selectedFolder;
  });

  ipcMain.handle('folder:select-dropped', async (_e, dropped: string): Promise<string | null> => {
    try {
      if (typeof dropped !== 'string' || !(await fs.stat(dropped)).isDirectory()) return null;
    } catch {
      return null;
    }
    selectedFolder = dropped;
    return selectedFolder;
  });

  ipcMain.handle('folder:list', async (_e, recursive: boolean): Promise<ImageListing> => {
    if (!selectedFolder) return { folder: '', files: [] };
    const preset = store.selected();
    const files = await discoverImages(selectedFolder, { recursive: !!recursive, preset: preset ?? undefined });
    return { folder: selectedFolder, files: files.map((f) => path.relative(selectedFolder!, f)) };
  });

  ipcMain.handle('presets:get', () => presetState());
  ipcMain.handle('presets:add', (_e, input: PresetInput) => mutate(() => store.add(input)));
  ipcMain.handle('presets:update', (_e, id: string, input: PresetInput) => mutate(() => store.update(id, input)));
  ipcMain.handle('presets:remove', async (_e, id: string) => {
    await store.remove(id);
    return presetState();
  });
  ipcMain.handle('presets:select', async (_e, id: string) => {
    await store.select(id);
    return presetState();
  });

  ipcMain.handle('batch:run', async (event, options: RunOptions): Promise<BatchSummary> => {
    const preset = store.selected();
    if (!selectedFolder || !preset) throw new Error('Select a folder and a preset first');
    if (running) throw new Error('A batch is already running');

    const files = await discoverImages(selectedFolder, { recursive: !!options.recursive, preset });
    running = new AbortController();
    try {
      return await runBatch(
        files.sort(),
        {
          target: { width: preset.width, height: preset.height },
          format: options.format,
          quality: options.quality,
          outputMode: options.outputMode === 'single' ? 'single' : 'each',
          outputRoot: selectedFolder,
          signal: running.signal,
          onResult: (result, completed, total) => {
            // Send paths relative to the folder, matching the file list shown in the UI.
            const shown = { ...result, file: path.relative(selectedFolder!, result.file), output: result.output && path.basename(result.output) };
            event.sender.send('batch:result', shown, completed, total);
          },
        },
      );
    } finally {
      running = null;
    }
  });

  ipcMain.handle('batch:cancel', () => {
    running?.abort();
  });
}
