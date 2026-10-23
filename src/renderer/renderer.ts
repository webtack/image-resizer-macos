import type { FileResult, PresetErrors, PresetResult, PresetState, ResizerApi, SizePreset } from '../shared/api';

declare global {
  interface Window {
    /** Narrow API injected by `src/preload/preload.ts`. */
    resizer: ResizerApi;
  }
}

const api = window.resizer;

/** Looks up a required element by id; throws early if the HTML and script drift apart. */
function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element #${id}`);
  return node as T;
}

const ui = {
  dropZone: el('drop-zone'),
  pickFolder: el<HTMLButtonElement>('pick-folder'),
  folderPath: el('folder-path'),
  recursive: el<HTMLInputElement>('recursive'),
  outputMode: el<HTMLSelectElement>('output-mode'),
  imageCount: el('image-count'),
  noImages: el('no-images'),
  fileList: el('file-list'),
  presetSelect: el<HTMLSelectElement>('preset-select'),
  managePresets: el<HTMLButtonElement>('manage-presets'),
  format: el<HTMLSelectElement>('format'),
  quality: el<HTMLInputElement>('quality'),
  qualityValue: el('quality-value'),
  run: el<HTMLButtonElement>('run'),
  cancel: el<HTMLButtonElement>('cancel'),
  progress: el<HTMLProgressElement>('progress'),
  summary: el('summary'),
  results: el('results'),
  dialog: el<HTMLDialogElement>('presets-dialog'),
  presetList: el('preset-list'),
  form: el<HTMLFormElement>('preset-form'),
  formTitle: el('preset-form-title'),
  name: el<HTMLInputElement>('preset-name'),
  width: el<HTMLInputElement>('preset-width'),
  height: el<HTMLInputElement>('preset-height'),
  save: el<HTMLButtonElement>('preset-save'),
  resetEdit: el<HTMLButtonElement>('preset-reset'),
  closeDialog: el<HTMLButtonElement>('presets-close'),
};

/** Mutable UI state; the source of truth for folder and preset lives in the main process. */
const state = {
  folder: '',
  images: [] as string[],
  presets: { presets: [], selectedId: null } as PresetState,
  running: false,
  editingId: null as string | null,
};

/**
 * Enables Run only when a folder with at least one image and a preset are selected (spec:
 * "Run requires valid inputs") and no batch is running.
 */
function updateRunButton(): void {
  ui.run.disabled = state.running || state.images.length === 0 || state.presets.selectedId === null;
}

/** Re-scans the selected folder and redraws the image list and counts. */
async function refreshImages(): Promise<void> {
  const listing = await api.listImages(ui.recursive.checked);
  state.folder = listing.folder;
  state.images = listing.files;
  ui.folderPath.textContent = listing.folder || 'or drop a folder onto this window';
  ui.fileList.replaceChildren(...listing.files.map((f) => Object.assign(document.createElement('li'), { textContent: f })));
  const hasFolder = listing.folder !== '';
  ui.imageCount.textContent = hasFolder ? `${listing.files.length} image(s) to process` : '';
  ui.noImages.hidden = !(hasFolder && listing.files.length === 0);
  updateRunButton();
}

/** Applies new preset state to the picker and the manage dialog. */
function applyPresets(next: PresetState): void {
  state.presets = next;
  ui.presetSelect.replaceChildren(
    ...next.presets.map((p) => {
      const option = new Option(`${p.name} (${p.width}×${p.height})`, p.id, false, p.id === next.selectedId);
      return option;
    }),
  );
  ui.presetSelect.disabled = next.presets.length === 0;
  renderPresetList();
  updateRunButton();
}

/** Redraws the list inside the "Manage presets" dialog with edit/delete buttons. */
function renderPresetList(): void {
  ui.presetList.replaceChildren(
    ...state.presets.presets.map((p) => {
      const li = document.createElement('li');
      const name = Object.assign(document.createElement('span'), { className: 'name', textContent: `${p.name} — ${p.width}×${p.height}` });
      const edit = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Edit' });
      edit.addEventListener('click', () => startEdit(p));
      const del = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Delete' });
      del.addEventListener('click', async () => {
        if (state.editingId === p.id) resetForm();
        applyPresets(await api.presets.remove(p.id));
        await refreshImages();
      });
      li.append(name, edit, del);
      return li;
    }),
  );
}

/** Shows inline validation messages under the matching form fields. */
function showErrors(errors: PresetErrors): void {
  el('err-name').textContent = errors.name ?? '';
  el('err-width').textContent = errors.width ?? '';
  el('err-height').textContent = errors.height ?? '';
}

/** Puts the preset form back into "new preset" mode. */
function resetForm(): void {
  state.editingId = null;
  ui.form.reset();
  ui.formTitle.textContent = 'New preset';
  ui.save.textContent = 'Add';
  ui.resetEdit.hidden = true;
  showErrors({});
}

/** Loads a preset into the form for editing. */
function startEdit(p: SizePreset): void {
  state.editingId = p.id;
  ui.name.value = p.name;
  ui.width.value = String(p.width);
  ui.height.value = String(p.height);
  ui.formTitle.textContent = 'Edit preset';
  ui.save.textContent = 'Save';
  ui.resetEdit.hidden = false;
  showErrors({});
}

/**
 * Parses a size field. Anything that is not a plain integer becomes NaN so the core validator
 * rejects it with its normal message (spec: "non-number" is invalid).
 */
function parseSide(text: string): number {
  return /^\s*\d+\s*$/.test(text) ? Number(text) : NaN;
}

ui.pickFolder.addEventListener('click', async () => {
  if (await api.pickFolder()) await refreshImages();
});
ui.recursive.addEventListener('change', () => {
  // The save mode only matters for subfolders, so it follows the checkbox.
  ui.outputMode.disabled = !ui.recursive.checked;
  void refreshImages();
});

// Folder drag-and-drop: the whole window is a drop target; the main process validates the path.
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  ui.dropZone.classList.add('dragging');
});
window.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null) ui.dropZone.classList.remove('dragging');
});
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  ui.dropZone.classList.remove('dragging');
  const file = e.dataTransfer?.files[0];
  if (file && (await api.selectDroppedFolder(file))) await refreshImages();
});

ui.presetSelect.addEventListener('change', async () => {
  applyPresets(await api.presets.select(ui.presetSelect.value));
  // The excluded "previous outputs" depend on the selected preset size, so rescan.
  await refreshImages();
});
ui.managePresets.addEventListener('click', () => {
  resetForm();
  ui.dialog.showModal();
});
ui.closeDialog.addEventListener('click', () => ui.dialog.close());
ui.resetEdit.addEventListener('click', resetForm);
ui.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = { name: ui.name.value, width: parseSide(ui.width.value), height: parseSide(ui.height.value) };
  const result: PresetResult = state.editingId ? await api.presets.update(state.editingId, input) : await api.presets.add(input);
  if (!result.ok) {
    showErrors(result.errors);
    return;
  }
  applyPresets(result.state);
  resetForm();
  await refreshImages();
});

ui.quality.addEventListener('input', () => {
  ui.qualityValue.textContent = ui.quality.value;
});

/** Appends one per-file status line to the results list. */
function addResultLine(result: FileResult): void {
  const li = document.createElement('li');
  li.className = result.status;
  const detail = result.status === 'done' ? ` → ${result.output}` : result.status === 'failed' ? ` — ${result.error}` : ' — not processed';
  li.textContent = `${result.file}${detail}`;
  ui.results.append(li);
}

api.onResult((result, completed, total) => {
  addResultLine(result);
  ui.progress.max = total;
  ui.progress.value = completed;
});

ui.run.addEventListener('click', async () => {
  state.running = true;
  ui.results.replaceChildren();
  ui.summary.textContent = 'Processing…';
  ui.progress.value = 0;
  ui.progress.hidden = false;
  ui.cancel.hidden = false;
  updateRunButton();
  try {
    const s = await api.run({ recursive: ui.recursive.checked, format: ui.format.value as 'keep' | 'jpeg' | 'png', quality: Number(ui.quality.value), outputMode: ui.outputMode.value as 'each' | 'single' });
    const skipped = s.skipped > 0 ? `, ${s.skipped} not processed` : '';
    ui.summary.textContent = `Done: ${s.succeeded} succeeded, ${s.failed} failed${skipped}`;
  } catch (err) {
    ui.summary.textContent = `Error: ${(err as Error).message}`;
  } finally {
    state.running = false;
    ui.cancel.hidden = true;
    ui.progress.hidden = true;
    updateRunButton();
    // Fresh outputs now exist next to the originals; rescan so the count stays accurate.
    await refreshImages();
  }
});
ui.cancel.addEventListener('click', () => {
  ui.cancel.disabled = true;
  void api.cancel().finally(() => {
    ui.cancel.disabled = false;
  });
});

applyPresets(await api.presets.get());
await refreshImages();
