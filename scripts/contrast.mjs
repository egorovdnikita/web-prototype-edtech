#!/usr/bin/env node
// WCAG 2.x contrast ratio.
// Usage:
//   node scripts/contrast.mjs B01513 FFFBEF        — one pair
//   node scripts/contrast.mjs --palette            — whole platform palette vs background, black and white

const palette = {
  background: 'FFFBEF',
  'logo-bg': 'FDF6E9',
  'soc-light-pink': 'FCCBD1',
  'soc-dark-pink': 'FFA8B9',
  'soc-red': 'B01513',
  'hist-light-blue': 'D9EBFF',
  'hist-blue': 'C2D4E8',
  'hist-red': '7C2329',
  yellow: 'FFF7BD',
  'light-green': 'D9DC6A',
  'dark-green': '8F9134',
  'grey-variable': 'E1E1E1',
  grey: 'E0D8CA',
  'dark-grey-variable': '9F9F9F',
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
