# Spec Delta

## ADDED Requirements

### Requirement: Output names use the actual result size
The system SHALL build the `<width>x<height>` part of every output file name from the real pixel size of that output. For presets with both sides this equals the preset size; for one-sided presets it can differ from image to image.

#### Scenario: Width-only preset
- **WHEN** `a.jpg` (4000×3000) and `b.jpg` (3000×4000) are processed with a width-only preset of 1000
- **THEN** the results are named `a_1000x750.jpg` and `b_1000x1333.jpg`

#### Scenario: Two-sided preset
- **WHEN** `IMG_001.jpg` is processed with a 1080×1350 preset
- **THEN** the result is named `IMG_001_1080x1350.jpg`, as before

### Requirement: Previous outputs excluded for one-sided presets
For a one-sided preset the system SHALL treat files whose name ends with `_<width>x<anything>` (width-only) or `_<anything>x<height>` (height-only), optionally followed by a collision counter, as previous outputs and exclude them from discovery.

#### Scenario: Width-only preset
- **WHEN** the selected preset has width 1000 and the folder contains `photo_1000x750.jpg`
- **THEN** that file is not treated as a source image

#### Scenario: Height-only preset
- **WHEN** the selected preset has height 1350 and the folder contains `photo_1013x1350-1.jpg`
- **THEN** that file is not treated as a source image

#### Scenario: Unrelated size suffix
- **WHEN** the selected preset has width 1000 and the folder contains `photo_800x600.jpg`
- **THEN** that file is listed as a source image
