// Usage: node tests/release-notes.mjs <version> <notes-out> <title-out>
// Reads .github/release-notes/v<version>.md and fails unless it follows the
// release layout: "# v<version> — <subtitle>", English sections ending with
// "## Install", a "---" line, then the Chinese sections ending with "## 安裝".
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const [version, notesOut, titleOut] = process.argv.slice(2);
const file = `.github/release-notes/v${version}.md`;
const fail = msg => { console.error(`${file}: ${msg}`); process.exit(1); };
if (!existsSync(file)) fail('missing; write the release text before bumping the version');
const lines = readFileSync(file, 'utf8').replace(/\r/g, '').split('\n');
const title = lines.shift();
if (!title.startsWith(`# v${version} — `) || title.length <= `# v${version} — `.length) fail(`first line must be "# v${version} — <subtitle>"`);
const body = lines.join('\n').trim();
const split = body.split(/^---$/m);
if (split.length !== 2) fail('needs exactly one "---" line between the English and Chinese parts');
const [en, zh] = split;
if (!/^## (New|Fixes|Changes)$/m.test(en) || !/^## Install$/m.test(en)) fail('English part needs a "## New"/"## Fixes"/"## Changes" section and "## Install"');
if (!/^## (新增|修正|變更)$/m.test(zh) || !/^## 安裝$/m.test(zh)) fail('Chinese part needs a "## 新增"/"## 修正"/"## 變更" section and "## 安裝"');
writeFileSync(notesOut, body + '\n');
writeFileSync(titleOut, title.slice(2).trim());
console.log(title.slice(2).trim());
