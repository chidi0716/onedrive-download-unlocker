import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = readdirSync('dist').filter(name => name.endsWith('-firefox.zip'));
if (!files.length) throw new Error('Build the Firefox ZIP first');
for (const file of files) {
  const result = spawnSync(process.execPath, ['node_modules/addons-linter/bin/addons-linter', `dist/${file}`], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
