#!/usr/bin/env node
// WCAG 2.x contrast ratio.
// Usage:
//   node scripts/contrast.mjs 525252 FFFFFF        — one pair
//   node scripts/contrast.mjs --palette            — prototype roles (Box UI, monochrome) vs page, black and white

const palette = {
  background: 'FFFFFF', // surface-base-fill-page (прототип)
  'layer-subtle': 'F5F5F5', // surface-base-fill-layer-subtle
  'content-strong': '171717',
  'content-muted': '525252', // neutral-600, поднят в app.css
  'content-subtle': 'A3A3A3', // иконки
  'positive-ink': '155C31',
  'warning-ink': '92400E',
  'negative-ink': '7F1D1D',
  black: '000000',
  white: 'FFFFFF',
};

function luminance(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function verdict(r) {
  if (r >= 7) return 'AAA';
  if (r >= 4.5) return 'AA';
  if (r >= 3) return 'AA крупный / UI';
  return 'не проходит';
}

const args = process.argv.slice(2);

if (args[0] === '--palette') {
  const rows = Object.entries(palette).map(([name, hex]) => ({
    name,
    hex: `#${hex}`,
    'vs фон': ratio(hex, palette.background).toFixed(2),
    'чёрный на нём': ratio('000000', hex).toFixed(2),
    'белый на нём': ratio('FFFFFF', hex).toFixed(2),
  }));
  console.table(rows);
} else if (args.length === 2) {
  const r = ratio(args[0], args[1]);
  console.log(`${r.toFixed(2)}:1 — ${verdict(r)}`);
} else {
  console.log('node scripts/contrast.mjs <hex1> <hex2> | --palette');
  process.exit(1);
}
