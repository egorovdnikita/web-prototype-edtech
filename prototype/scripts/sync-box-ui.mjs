#!/usr/bin/env node
// Copies Box UI into src/vendor/box-ui: token CSS, the React primitives and only
// the icons listed in icons.json. Box UI is not published to npm, so the
// prototype carries a snapshot and this script refreshes it.
//
//   node scripts/sync-box-ui.mjs              — from ../../box-ui (sibling checkout)
//   BOX_UI_DIR=/path/to/box-ui node scripts/sync-box-ui.mjs

import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const boxUi = resolve(process.env.BOX_UI_DIR ?? join(root, '..', '..', 'box-ui'));
const out = join(root, 'src', 'vendor', 'box-ui');

const tokens = join(boxUi, 'packages', 'tokens', 'dist', 'css');
const react = join(boxUi, 'packages', 'react', 'src');
const icons = join(boxUi, 'packages', 'icons', 'src', 'data');

mkdirSync(join(out, 'css'), { recursive: true });
for (const file of ['primitives.css', 'theme.css', 'controls.css', 'adaptive.css']) {
  cpSync(join(tokens, file), join(out, 'css', file));
}

// The primitives import the tokens by package name; the layout imports the CSS
// files itself, in order, so the @import lines are dropped.
const styles = readFileSync(join(react, 'styles.css'), 'utf8').replace(/^@import .*\n/gm, '');
writeFileSync(join(out, 'css', 'components.css'), styles);
cpSync(join(react, 'components.tsx'), join(out, 'components.tsx'));

const wanted = JSON.parse(readFileSync(join(here, 'icons.json'), 'utf8'));
const subset = {};
for (const style of wanted.styles) {
  const set = JSON.parse(readFileSync(join(icons, `${style}.json`), 'utf8'));
  subset[style] = {};
  for (const name of wanted.names) {
    if (!set[name]) throw new Error(`Box UI has no icon "${name}" in style "${style}"`);
    subset[style][name] = set[name];
  }
}
writeFileSync(join(out, 'icons.json'), JSON.stringify(subset));

const { version } = JSON.parse(readFileSync(join(boxUi, 'package.json'), 'utf8'));
writeFileSync(join(out, 'VERSION'), `${version}\n`);
console.log(`Box UI ${version}: tokens, components, ${wanted.names.length} icons × ${wanted.styles.length} styles → ${out}`);
