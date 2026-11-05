const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
exports.load = function (file, transform = s => s) {
  const context = vm.createContext({ Blob, TextEncoder, Uint8Array, atob });
  context.window = context;
  vm.runInContext(transform(fs.readFileSync(path.join(__dirname, '..', file), 'utf8')), context, { filename: file });
  return context;
};
exports.inspectPdf = function (bytes, pages) {
  const data = Buffer.from(bytes);
  const text = data.toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4'));
  const start = /startxref\n(\d+)\n%%EOF\n$/.exec(text);
  assert.ok(start, 'startxref exists');
  const offset = Number(start[1]);
  assert.equal(text.slice(offset, offset + 5), 'xref\n');
  const table = text.slice(offset).split('\n');
  const count = Number(table[1].split(' ')[1]);
  assert.equal(count, 3 + pages * 3);
  assert.equal(table[2], '0000000000 65535 f ');
  for (let n = 1; n < count; n++) {
    assert.match(table[n + 2], /^\d{10} 00000 n $/);
    const pos = Number(table[n + 2].slice(0, 10));
    assert.equal(text.slice(pos, pos + `${n} 0 obj\n`.length), `${n} 0 obj\n`);
  }
  assert.equal((text.match(/\/Type \/Page\b/g) || []).length, pages);
  assert.match(text, new RegExp(`/Count ${pages}\\b`));
  const images = [];
  const re = /\/Filter \/DCTDecode \/Length (\d+) >>\nstream\n/g;
  let match;
  while ((match = re.exec(text))) images.push(data.subarray(re.lastIndex, re.lastIndex + Number(match[1])));
  assert.equal(images.length, pages);
  return images;
};
