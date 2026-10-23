# Spec Delta

## Purpose

Lets the user pick a folder and resize every supported image in it in one run, writing the results next to the originals without touching the originals.

## ADDED Requirements

### Requirement: Folder selection and image discovery
The system SHALL let the user choose a folder through a standard macOS folder picker or by dropping a folder onto the window, and SHALL list all supported images (JPEG, PNG, HEIC, TIFF, WebP) found in it. Subfolders SHALL be scanned only when the user enables "include subfolders". Files previously produced by the app (matching the output naming pattern for the selected preset) SHALL be excluded from discovery.

#### Scenario: Folder with mixed files
- **WHEN** the user selects a folder containing 5 JPEGs, 2 PNGs and 3 text files
- **THEN** the app shows 7 images to process and ignores the text files

#### Scenario: Subfolders disabled
- **WHEN** the folder has images in a subfolder and "include subfolders" is off
- **THEN** only images directly in the selected folder are listed

#### Scenario: Previous outputs are skipped
- **WHEN** the folder already contains `photo_1080x1350.jpg` produced for the selected preset
- **THEN** that file is not treated as a source image

### Requirement: Output beside originals
The system SHALL write each resized image into the same folder as its original, named `<original-name>_<width>x<height>.<ext>`. The system MUST NOT modify or delete originals and MUST NOT overwrite an existing file; on a name collision it SHALL append a numeric counter.

#### Scenario: Normal output
- **WHEN** `IMG_001.jpg` is processed with a 1080×1350 preset
- **THEN** `IMG_001_1080x1350.jpg` is created in the same folder and `IMG_001.jpg` is unchanged

#### Scenario: Name collision
- **WHEN** `IMG_001_1080x1350.jpg` already exists but is not a source image for this run
- **THEN** the new file is saved as `IMG_001_1080x1350-1.jpg`

### Requirement: Output format options
The system SHALL let the user choose output format "Keep original", JPEG or PNG, and a JPEG quality from 1 to 100 (default 90). "Keep original" SHALL keep JPEG, PNG, WebP and TIFF sources in their own format; formats that cannot be written (e.g. a HEIC source) SHALL fall back to JPEG. Image orientation metadata SHALL be applied so output appears upright.

#### Scenario: Force JPEG
- **WHEN** format is JPEG at quality 80 and the source is a PNG
- **THEN** the output is a `.jpg` file encoded at quality 80

#### Scenario: Rotated photo
- **WHEN** the source has EXIF orientation "rotated 90°"
- **THEN** the output is upright with the correct canvas orientation

### Requirement: Run progress, cancel and errors
The system SHALL process the batch off the main thread, show overall progress and a per-file status (pending, done, failed), and allow the user to cancel. A failure on one file MUST NOT stop the rest of the batch; the failure reason SHALL be shown, and a summary of succeeded/failed counts displayed at the end.

#### Scenario: One corrupt file
- **WHEN** a batch of 10 images includes one corrupt file
- **THEN** 9 outputs are produced, the corrupt file is marked failed with a reason, and the summary reads 9 succeeded, 1 failed

#### Scenario: Cancel
- **WHEN** the user cancels midway through a batch
- **THEN** processing stops after the current file, finished outputs are kept, and remaining files are marked as not processed

### Requirement: Write failures are isolated
The system SHALL read and write files only inside the folder the user selected (via the folder picker or by dropping a folder onto the window). When a write is not permitted (for example a read-only folder), the affected file SHALL be marked failed with a clear reason and the rest of the batch SHALL continue.

#### Scenario: Read-only folder
- **WHEN** the user selects a folder that cannot be written to
- **THEN** each file is marked failed with a "cannot write to folder" reason and the app does not crash

#### Scenario: Dropped folder
- **WHEN** the user drags a folder onto the window
- **THEN** it is treated as the selected folder and results are written inside it

### Requirement: No network access or data collection
The system MUST NOT make network connections and MUST NOT collect, store or transmit user data or image contents outside the user's machine.

#### Scenario: Offline operation
- **WHEN** the app is used with no network connection
- **THEN** all features work identically

### Requirement: Run requires valid inputs
The system SHALL disable the Run action until a folder with at least one supported image and a size preset are selected.

#### Scenario: Empty folder
- **WHEN** the selected folder has no supported images
- **THEN** Run is disabled and a "no images found" message is shown
