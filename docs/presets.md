# Size presets

A preset is a name plus a canvas size (width × height in pixels). Exactly one preset must be selected
to run.

## Starter presets

Four presets are created on first launch (the first one is selected):

| Name | Size |
| --- | --- |
| Square | 1080×1080 |
| Portrait 4:5 | 1080×1350 |
| Full HD 16:9 | 1920×1080 |
| HD 16:9 | 1280×720 |

They can be edited and deleted.

## Selecting a preset

In block **2. Size**, pick a preset from the list. The choice is remembered between launches.

## Creating

1. Click **Manage presets…**.
2. In the **New preset** form, enter **Name**, **Width** and **Height**.
3. Click **Add**. The preset appears in the list and in the selector.

## Editing

1. In the **Manage presets** window, click **Edit** next to the preset.
2. Change the fields (the form is titled **Edit preset**) and click **Save**.
3. **Cancel edit** returns the form to create mode without changes.

## Deleting

Click **Delete** next to the preset. If the selected preset is deleted, the first remaining one is
selected automatically. If the list is empty, no preset is selected and the Run button is disabled.

## Rules and error messages

- **Name** cannot be empty and must be unique (case-insensitive):
  `A preset with this name already exists`.
- **Width** and **Height** are whole numbers from 1 to 16384:
  `Width must be a whole number from 1 to 16384` (likewise for `Height`). Zero, fractions and text are
  not accepted.
- Messages are shown under the corresponding fields, and the preset is not saved until they are fixed.

## Where they are stored

In the `presets.json` file in the app's data folder:

```
~/Library/Application Support/Image Resizer/presets.json
```

It holds the list of presets and the id of the selected one. If the file is damaged or deleted, the app
restores the four starter presets.
