# size-presets Specification

## Purpose

Lets the user save frequently used target sizes as named presets and pick one for each batch run.

## Requirements

### Requirement: Create, edit and delete presets
The system SHALL let the user create a preset with a name and a width and height in pixels (positive integers, 1–16384), edit existing presets, and delete them. Names MUST be non-empty and unique.

#### Scenario: Create preset
- **WHEN** the user adds a preset "Instagram Portrait" with 1080 × 1350
- **THEN** it appears in the preset list and can be selected

#### Scenario: Invalid size
- **WHEN** the user enters a width of 0 or a non-number
- **THEN** the preset cannot be saved and the field shows a validation message

#### Scenario: Duplicate name
- **WHEN** the user saves a preset with a name that already exists
- **THEN** the save is rejected with a message

### Requirement: Default presets
The system SHALL ship with a starter set of presets (1080×1080, 1080×1350, 1920×1080, 1280×720) on first launch. Users MAY delete or edit them.

#### Scenario: First launch
- **WHEN** the app is launched for the first time
- **THEN** the four default presets are listed and the first is selected

### Requirement: Persistence and selection
The system SHALL persist presets and the last selected preset across app launches, and SHALL require exactly one selected preset for a run.

#### Scenario: Relaunch
- **WHEN** the user creates a preset, quits and reopens the app
- **THEN** the preset is still listed and the previously selected preset is selected

#### Scenario: Selected preset deleted
- **WHEN** the selected preset is deleted
- **THEN** another preset is selected automatically, or none if the list is empty (and Run is disabled)
