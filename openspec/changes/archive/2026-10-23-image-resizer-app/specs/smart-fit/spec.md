# Spec Delta

## Purpose

Defines how an image is fitted to a target canvas: the whole photo stays visible, scaled by its larger side, and any empty margins are filled with a blurred version of the same photo.

## ADDED Requirements

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
