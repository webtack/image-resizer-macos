// Copies non-TypeScript renderer assets (HTML, CSS) next to the compiled renderer scripts.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const from = 'src/renderer';
const to = 'dist/renderer';
mkdirSync(to, { recursive: true });
for (const name of readdirSync(from)) {
  if (name.endsWith('.html') || name.endsWith('.css')) {
    cpSync(join(from, name), join(to, name));
  }
}
