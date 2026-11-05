const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load, inspectPdf } = require('../helpers');
const util = load('util.js').ODPDF_UTIL;
test('sanitizeFilename replaces path characters and strips controls, Co and Cf', () => {
  assert.equal(util.sanitizeFilename(' a\\/:*?"<>|b.  '), 'a_________b');
  assert.equal(util.sanitizeFilename('課\uE972\u{F0000}\u{100000}\u200B\u202E\u0000程'), '課程');
  assert.equal(util.sanitizeFilename('x'.repeat(200)).length, 150);
  assert.equal(util.sanitizeFilename(null), '');
});
test('base64ToBytes round trips all byte values', () => {
  const input = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
  assert.deepEqual(Buffer.from(util.base64ToBytes(input.toString('base64'))), input);
});
test('concatBytes preserves order and empty inputs', () => {
  assert.deepEqual([...util.concatBytes([new Uint8Array([0, 255]), new Uint8Array(), new Uint8Array([3])])], [0, 255, 3]);
  assert.equal(util.concatBytes([]).length, 0);
});
test('buildPdfBlob writes three JPEG pages with byte-accurate xref', async () => {
  const jpegs = [1, 2, 3].map(n => fs.readFileSync(path.join(__dirname, `../fixtures/slide-${n}.jpg`)));
  const pdf = load('slidepdf.js').ODPDF_PDF.buildPdfBlob(jpegs, 1);
  assert.equal(pdf.type, 'application/pdf');
  const images = inspectPdf(await pdf.arrayBuffer(), 3);
  images.forEach((image, i) => assert.deepEqual(image, jpegs[i]));
});
test('translation tables have identical keys and placeholders', () => {
  // Expose the private table in this VM only; production source stays unchanged.
  const { __strings: strings } = load('i18n.js', s => s.replace('global.ODPDF_I18N =', 'global.__strings = STRINGS; global.ODPDF_I18N ='));
  assert.deepEqual(Object.keys(strings.en).sort(), Object.keys(strings['zh-Hant']).sort());
  for (const [key, value] of Object.entries(strings.en)) {
    const placeholders = s => [...s.matchAll(/\{([^}]+)\}/g)].map(m => m[1]).sort();
    assert.deepEqual(placeholders(value), placeholders(strings['zh-Hant'][key]), key);
  }
});
