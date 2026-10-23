# Project rules

## Code
- All code MUST be commented in English: every exported type, function and non-obvious block gets a TSDoc comment (`/** … */`) explaining what it does and why.
- Public APIs MUST include a usage example in the doc comment (English), e.g.:
  ```ts
  /**
   * Fits an image onto a canvas, filling empty margins with a blurred copy.
   *
   * @example
   * const result = await smartFit(input, { width: 1080, height: 1350 });
   */
  ```
- Identifiers, commit messages and OpenSpec artifacts are in English.

## Documentation
- The `docs/` folder is mandatory. Documentation about the app MUST be kept up to date there, written in Ukrainian.
- Any change to behavior, UI, presets, build or release steps MUST update the matching file in `docs/` in the same change.
- Code identifiers, commands and file names inside the docs stay in their original form.
