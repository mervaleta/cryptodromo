import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const system = read('design/crc-system.css');
const guide = read('design/crc-styleguide.html');

test('CRC 1.0 keeps primary legacy identity explicit', () => {
  const expected = {
    '--crc-green': '#7ace7a', '--crc-red': '#cd0604',
    '--crc-black': '#070707', '--crc-bg': '#0e0d0d',
    '--crc-surface': '#171615', '--crc-panel': '#221f1e',
    '--crc-muted-legacy': '#878787', '--crc-success-legacy': '#3bb34f',
  };
  for (const [token,hex] of Object.entries(expected)) {
    assert.match(system,new RegExp(token.replace(/[.*+?^$\x7b\x7d()|[\]\\]/g,'\\$&') + '\\s*:\\s*' + hex,'i'), token);
  }
  assert.match(system, /'Segoe UI',Arial,sans-serif/i);
});
test('12 color positions remain assigned to their historical place', () => {
  const hexes=['972a19','ffffff','245693','fadd07','2e9028','383838','b86a01','f57bf8','18629f','4e1584','5b5b5b','7d9b15'];
  hexes.forEach((hex,i)=>{
    assert.ok(system.includes('--crc-pos-' + (i+1) + ':#' + hex), 'position ' + (i+1));
    assert.ok(system.includes('[data-place="' + (i+1) + '"]'), 'badge ' + (i+1));
  });
});
test('shared entrypoints import one CSS system without altering functionality', () => {
  for (const path of [
    'assets/site-shell.css','assets/stadium-hub.css','assets/race-site-hub.css',
    'assets/institutional.css','assets/crp-global-nav.css',
    'admin/horses/editor.css','cryptodromo-gazette/public/assets/style.css'
  ]){
    const content=read(path);
    assert.match(content, /^@import url\("\/design\/crc-system\.css\?v=crc-1"\);/i, path);
  }
});
test('component contract covers common sports and consumer states', () => {
  for (const cls of ['crc-panel','crc-card','crc-button','crc-tab','crc-table',
    'crc-field','crc-input','crc-select','crc-textarea','crc-badge','crc-modal',
    'crc-tooltip','crc-toast','crc-pagination','crc-empty','crc-loading',
    'crc-alert','crc-race-clock','crc-standing']){
      assert.ok(system.includes('.' + cls),cls);
  }
  assert.match(system,/prefers-reduced-motion\s*:\s*reduce/i);
  assert.match(system,/:focus-visible/);
  assert.match(system,/tabular-nums/);
  assert.match(system,/@media\(max-width:600px\)/);
  assert.doesNotMatch(system,/!important/);
});
test('the specimen is accessible, local, interactive and honest about demo data', () => {
  assert.match(guide, /<html lang="es">/);
  assert.match(guide, /<meta name="viewport"/);
  assert.match(guide, /\.\/crc-system\.css/);
  assert.match(guide, /<dialog class="crc-modal/);
  assert.match(guide, /role="tablist"/);
  assert.match(guide, /type="submit"/);
  assert.match(guide, /datos de demostración son ficticios/i);
  assert.match(guide, /addEventListener\('keydown'/);
  assert.ok(existsSync(new URL('../docs/CRC_IDENTITY_20261104.md',import.meta.url)));
});
test('CSS adapters do not target the 3D renderer or impose new libraries', () => {
  const withoutComments = system.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(withoutComments,/canvas\s*\x7b|\.horse-mesh|\.track-mesh|\.lane-mesh|three\.js|webgl|\.glb/i);
  assert.doesNotMatch(system,/fonts\.googleapis|@font-face|tailwind|bootstrap/i);
});

test('top-level hubs mount the canonical navigation, rather than maintaining a second menu', () => {
  for(const page of ['index.html','stadiums/crypto/index.html','stadiums/crypto/archive/index.html']){
    const html = read(page);
    assert.match(html, /<header class="hub-head sitebar">/i, page);
    assert.match(html, /\/assets\/crp-global-nav\.css\?v=crc-nav1/);
    assert.match(html, /\/assets\/crp-global-nav\.js\?v=crc-nav1/);
  }
});
test('navigation and page content align to the same modern shell', () => {
  assert.match(system,/--crc-shell-max:1480px/);
  assert.match(system,/--crc-shell-width:min\(/);
  assert.match(read('assets/crp-global-nav.css'),/width:var\(--crc-shell-width\)!important/);
  for(const css of ['assets/site-shell.css','assets/stadium-hub.css','assets/race-site-hub.css']){
    assert.match(read(css),/width:var\(--crc-shell-width\)/,css);
  }
});
