# Spec Delta

## ADDED Requirements

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
