# smart-fit Specification

## Purpose

Defines how an image is fitted to a target canvas: the whole photo stays visible, scaled by its larger side, and any empty margins are filled with a blurred version of the same photo.

## Requirements

### Requirement: Fit by larger side without cropping
The system SHALL produce an output canvas of exactly the preset's width × height. The photo SHALL be scaled, preserving aspect ratio, by the factor at which its larger side (relative to the canvas) just fits, so that the entire photo is visible and none of it is cropped, and SHALL be centred on the canvas.

#### Scenario: Landscape photo on portrait canvas
- **WHEN** a 4000×3000 photo is fitted to a 1080×1350 canvas
- **THEN** the photo is scaled to 1080×810, centred vertically, and the output is 1080×1350

#### Scenario: Aspect ratio matches
- **WHEN** a 2000×2500 photo is fitted to a 1080×1350 canvas
- **THEN** the photo fills the whole canvas and no background is visible

### Requirement: Blurred photo background for empty margins
Where the scaled photo does not cover the canvas, the system SHALL fill the margins with the same photo scaled to cover the entire canvas (cropped as needed, centred) and blurred, so no flat colour bars appear. The blur SHALL be strong enough that the background reads as ambient colour rather than a duplicate image.

#### Scenario: Margins filled
- **WHEN** the fitted photo leaves top and bottom margins
- **THEN** those margins show a blurred, enlarged version of the same photo, and the sharp photo sits on top of it

#### Scenario: Seam between photo and background
- **WHEN** the output is inspected at the photo's edge
- **THEN** the sharp photo has crisp edges and the background is continuous behind it with no gaps or transparent pixels

### Requirement: No upscaling artefacts for small sources
The system SHALL scale small sources up to fit the canvas by default using high-quality interpolation, and SHALL NOT output transparent pixels in JPEG results.

#### Scenario: Small source
- **WHEN** a 400×300 photo is fitted to 1080×1350
- **THEN** the output is 1080×1350, the photo is scaled up with smooth interpolation, and margins use the blurred background

#### Scenario: PNG with transparency
- **WHEN** a transparent PNG is processed to JPEG
- **THEN** transparent areas are composited over the blurred background, not black

### Requirement: Proportional resize when one side is given
When the selected preset specifies only a width or only a height, the system SHALL scale each photo, preserving its aspect ratio, so that the given side equals the preset value, and SHALL compute the other side from the photo's own proportions, rounded to the nearest whole pixel. The output SHALL contain the entire photo with no margins and no blurred background. The computed side SHALL be at least 1 and at most 16384 pixels. Sources smaller than the target SHALL be scaled up with high-quality interpolation. When both sides are given, the existing fit behavior SHALL apply unchanged.

#### Scenario: Width only, landscape photo
- **WHEN** a 4000×3000 photo is processed with a width-only preset of 1080
- **THEN** the output is 1080×810 and contains the whole photo with no background

#### Scenario: Height only, portrait photo
- **WHEN** a 3000×4000 photo is processed with a height-only preset of 1350
- **THEN** the output is 1013×1350 (width rounded from 1012.5)

#### Scenario: Different photos, different results
- **WHEN** a 4000×3000 photo and a 3000×4000 photo are processed with a width-only preset of 1000
- **THEN** the outputs are 1000×750 and 1000×1333

#### Scenario: Small source is enlarged
- **WHEN** a 400×300 photo is processed with a width-only preset of 1080
- **THEN** the output is 1080×810 and the photo is scaled up with smooth interpolation

#### Scenario: Extreme aspect ratio
- **WHEN** a 20000×100 photo is processed with a height-only preset of 1000
- **THEN** the computed width is clamped to 16384 and the photo is still produced without error

#### Scenario: Transparent PNG
- **WHEN** a transparent PNG is processed with a one-sided preset and written as JPEG
- **THEN** transparent areas are composited over white, not black

#### Scenario: Both sides given
- **WHEN** a preset has both width and height
- **THEN** the output is the exact canvas with the photo fitted by its larger side, as before
