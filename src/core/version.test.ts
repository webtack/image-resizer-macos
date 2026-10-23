import { describe, expect, it } from 'vitest';
import { APP_NAME } from './version';

describe('toolchain smoke test', () => {
  it('runs a unit test against core code', () => {
    expect(APP_NAME).toBe('Image Resizer');
  });
});
