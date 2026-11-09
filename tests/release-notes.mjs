// Prints the CHANGELOG.md section for a version (without its heading).
// Fails when the section is missing or empty, so a release never goes out without notes.
import { readFileSync } from 'node:fs';
const version = process.argv[2];
const lines = readFileSync('CHANGELOG.md', 'utf8').split('\n');
const start = lines.findIndex(l => l.startsWith(`## [${version}]`));
if (start < 0) { console.error(`CHANGELOG.md has no section for ${version}`); process.exit(1); }
let end = lines.findIndex((l, i) => i > start && l.startsWith('## ['));
if (end < 0) end = lines.length;
const body = lines.slice(start + 1, end).join('\n').trim();
if (!body) { console.error(`CHANGELOG.md section for ${version} is empty`); process.exit(1); }
console.log(body);
