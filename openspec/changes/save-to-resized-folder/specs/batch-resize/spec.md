# Spec Delta

## MODIFIED Requirements

### Requirement: Folder selection and image discovery
The system SHALL let the user choose a folder through a standard macOS folder picker or by dropping a folder onto the window, and SHALL list all supported images (JPEG, PNG, HEIC, TIFF, WebP) found in it. Subfolders SHALL be scanned only when the user enables "include subfolders", and a subfolder named `resized` SHALL never be scanned. Files previously produced by the app (matching the output naming pattern for the selected preset) SHALL be excluded from discovery.

#### Scenario: Folder with mixed files
- **WHEN** the user selects a folder containing 5 JPEGs, 2 PNGs and 3 text files
- **THEN** the app shows 7 images to process and ignores the text files

#### Scenario: Subfolders disabled
- **WHEN** the folder has images in a subfolder and "include subfolders" is off
- **THEN** only images directly in the selected folder are listed

#### Scenario: Previous outputs are skipped
- **WHEN** the folder already contains `photo_1080x1350.jpg` produced for the selected preset
- **THEN** that file is not treated as a source image

#### Scenario: Resized folder is not rescanned
- **WHEN** "include subfolders" is on and the folder contains a `resized` subfolder with images from an earlier run
- **THEN** the images inside `resized` are not listed

## ADDED Requirements

### Requirement: Output in resized folder
The system SHALL write each resized image into a subfolder named `resized` located inside the folder of its original, creating that subfolder when it does not exist, and name the file `<original-name>_<width>x<height>.<ext>`. The system MUST NOT modify or delete originals and MUST NOT overwrite an existing file; on a name collision it SHALL append a numeric counter. With "include subfolders" on, the user SHALL be able to choose where outputs for images in subfolders go: by default into the `resized` folder inside that subfolder ("each folder"), or alternatively into the single `resized` folder of the selected folder ("one folder"). The choice SHALL have no effect on images located directly in the selected folder.

#### Scenario: Normal output
- **WHEN** `IMG_001.jpg` is processed with a 1080×1350 preset
- **THEN** `resized/IMG_001_1080x1350.jpg` is created in the original's folder and `IMG_001.jpg` is unchanged

#### Scenario: Folder is created on demand
- **WHEN** the selected folder has no `resized` subfolder
- **THEN** it is created before the first output is written

#### Scenario: Name collision
- **WHEN** `resized/IMG_001_1080x1350.jpg` already exists
- **THEN** the new file is saved as `resized/IMG_001_1080x1350-1.jpg`

#### Scenario: Nested source folder, default mode
- **WHEN** "include subfolders" is on, mode is "each folder" and `folder1/trip/IMG_002.jpg` is processed
- **THEN** the output is `folder1/trip/resized/IMG_002_<width>x<height>.jpg`

#### Scenario: Nested source folder, one folder mode
- **WHEN** "include subfolders" is on, mode is "one folder" and `folder1/trip/IMG_002.jpg` is processed with `folder1` selected
- **THEN** the output is `folder1/resized/IMG_002_<width>x<height>.jpg`

#### Scenario: Collision in one folder mode
- **WHEN** mode is "one folder" and `a/IMG.jpg` and `b/IMG.jpg` are both processed
- **THEN** the outputs are `resized/IMG_<w>x<h>.jpg` and `resized/IMG_<w>x<h>-1.jpg` and neither is overwritten

## REMOVED Requirements

### Requirement: Output beside originals
**Reason**: Replaced by "Output in resized folder"; results are no longer mixed with originals.
**Migration**: Results of earlier runs stay beside their originals and are still ignored by discovery for the same preset; move or delete them manually if unwanted.
