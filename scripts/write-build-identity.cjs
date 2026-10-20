// HQ-owned build provenance; no timestamp or environment secret is embedded.
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
if (git('status', '--porcelain', '--untracked-files=no')) throw new Error('Build input has tracked changes');
const source = git('rev-parse', '--verify', 'HEAD');
const tree = git('rev-parse', 'HEAD^{tree}');
if (!/^[a-f0-9]{40}$/.test(source) || !/^[a-f0-9]{40}$/.test(tree)) throw new Error('Invalid Git provenance');
fs.writeFileSync('src/lib/build-commit.generated.ts', 'export const QM_BUILD_COMMIT = ' + JSON.stringify(source) + ';\n');
console.log(JSON.stringify({ event: 'QM_BUILD_INPUT', source, tree, generatedFrom: 'clean tracked HEAD' }));
