// Usage: node tests/release-notes.mjs <version> <notes-out> <title-out>
// Notes come from .github/release-notes/v<version>.md (first line "# <title>",
// the rest is the body); without that file, from the version's CHANGELOG.md
// section with title v<version>. Fails when neither has text.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
const [version, notesOut, titleOut] = process.argv.slice(2);
const file = `.github/release-notes/v${version}.md`;
let title = `v${version}`, body;
if (existsSync(file)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  if (lines[0].startsWith('# ')) title = lines.shift().slice(2).trim();
  body = lines.join('\n').trim();
} else {
  const lines = readFileSync('CHANGELOG.md', 'utf8').split('\n');
  const start = lines.findIndex(l => l.startsWith(`## [${version}]`));
  if (start < 0) { console.error(`No ${file} and no CHANGELOG.md section for ${version}`); process.exit(1); }
  let end = lines.findIndex((l, i) => i > start && l.startsWith('## ['));
  if (end < 0) end = lines.length;
  body = lines.slice(start + 1, end).join('\n').trim();
}
if (!body) { console.error(`Release notes for ${version} are empty`); process.exit(1); }
writeFileSync(notesOut, body + '\n');
writeFileSync(titleOut, title);
console.log(title);
