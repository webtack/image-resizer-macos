import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { FileResult, ResizerApi } from '../shared/api';

/**
 * Exposes the narrow `window.resizer` API to the isolated renderer.
 * Every method maps to one IPC channel handled in `src/main/ipc.ts`.
 */
const api: ResizerApi = {
  pickFolder: () => ipcRenderer.invoke('folder:pick'),
  // The dropped File is turned into a filesystem path here, because only the preload can do that.
  selectDroppedFolder: (file) => ipcRenderer.invoke('folder:select-dropped', webUtils.getPathForFile(file)),
  listImages: (recursive) => ipcRenderer.invoke('folder:list', recursive),
  presets: {
    get: () => ipcRenderer.invoke('presets:get'),
    add: (input) => ipcRenderer.invoke('presets:add', input),
    update: (id, input) => ipcRenderer.invoke('presets:update', id, input),
    remove: (id) => ipcRenderer.invoke('presets:remove', id),
    select: (id) => ipcRenderer.invoke('presets:select', id),
  },
  run: (options) => ipcRenderer.invoke('batch:run', options),
  cancel: () => ipcRenderer.invoke('batch:cancel'),
  onResult: (callback) => {
    const listener = (_e: unknown, result: FileResult, completed: number, total: number): void => callback(result, completed, total);
    ipcRenderer.on('batch:result', listener);
    return () => ipcRenderer.removeListener('batch:result', listener);
  },
};

contextBridge.exposeInMainWorld('resizer', api);
