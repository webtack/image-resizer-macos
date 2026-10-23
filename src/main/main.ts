import { app, BrowserWindow } from 'electron';
import * as path from 'node:path';
import { APP_NAME } from '../core/version';
import { PresetStore } from '../core/presets';
import { registerIpc } from './ipc';

/**
 * Creates the single application window.
 *
 * Security: `contextIsolation` is on and `nodeIntegration` is off, so the renderer can only reach
 * the main process through the narrow API exposed by the preload script.
 *
 * @example
 * app.whenReady().then(createWindow);
 */
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 760,
    minHeight: 560,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  void win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  return win;
}

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(async () => {
  registerIpc(() => mainWindow, await PresetStore.open(app.getPath('userData')));
  mainWindow = createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
