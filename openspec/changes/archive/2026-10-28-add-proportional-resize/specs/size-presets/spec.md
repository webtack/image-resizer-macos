# Spec Delta

## MODIFIED Requirements

### Requirement: Create, edit and delete presets
The system SHALL let the user create a preset with a name and a width and/or height in pixels (positive integers, 1–16384), edit existing presets, and delete them. At least one of width and height MUST be given; a side left empty means "calculate it proportionally". Names MUST be non-empty and unique.

#### Scenario: Create preset
- **WHEN** the user adds a preset "Instagram Portrait" with 1080 × 1350
- **THEN** it appears in the preset list and can be selected

#### Scenario: Width only
- **WHEN** the user adds a preset "Web 1200" with width 1200 and an empty height
- **THEN** the preset is saved and is shown as `1200×auto`

#### Scenario: Height only
- **WHEN** the user adds a preset "Tall 1350" with an empty width and height 1350
- **THEN** the preset is saved and is shown as `auto×1350`

#### Scenario: Both sides empty
- **WHEN** the user leaves both width and height empty
- **THEN** the preset cannot be saved and a validation message says that at least one side is required

#### Scenario: Invalid size
- **WHEN** the user enters a width of 0 or a non-number
- **THEN** the preset cannot be saved and the field shows a validation message

#### Scenario: Duplicate name
- **WHEN** the user saves a preset with a name that already exists
- **THEN** the save is rejected with a message

### Requirement: Persistence and selection
The system SHALL persist presets (including presets with an empty side) and the last selected preset across app launches, SHALL keep presets saved by earlier versions working unchanged, and SHALL require exactly one selected preset for a run.

#### Scenario: Relaunch
- **WHEN** the user creates a preset, quits and reopens the app
- **THEN** the preset is still listed and the previously selected preset is selected

#### Scenario: Proportional preset survives relaunch
- **WHEN** the user creates a width-only preset, quits and reopens the app
- **THEN** the preset is listed with its width and an empty height

#### Scenario: Presets from an earlier version
- **WHEN** the app starts with a presets file that only contains presets with both sides
- **THEN** all of those presets are listed and behave as before

#### Scenario: Selected preset deleted
- **WHEN** the selected preset is deleted
- **THEN** another preset is selected automatically, or none if the list is empty (and Run is disabled)
