'use strict';
// Read a source snapshot, patch only a disposable copy, run real runtime
// functions with fixture dependencies. Never starts or writes the live server.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
if (sourceIndex < 0 || !args[sourceIndex + 1]) {
  console.error('Usage: node run-tests.cjs --source /path/to/server.js [--baseline]');
  process.exit(2);
}
const source = fs.readFileSync(path.resolve(args[sourceIndex + 1]));
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'foundry-turn-regression-'));
const env = { PATH: '/usr/local/bin:/usr/bin:/bin', HOME: scratch, TMPDIR: scratch,
  FOUNDRY_TURN_TEST_SOURCE: path.join(scratch, 'server.js') };
function run(command, argv) {
  const result = spawnSync(command, argv, { cwd: scratch, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Object.assign(new Error(command + ' exited ' + result.status), { status: result.status || 1 });
}
try {
  console.log('Source SHA256: ' + createHash('sha256').update(source).digest('hex'));
  fs.writeFileSync(env.FOUNDRY_TURN_TEST_SOURCE, source);
  if (!args.includes('--baseline')) {
    const patch = path.join(__dirname, 'server.patch');
    run('git', ['apply', '--check', '--whitespace=error', patch]);
    run('git', ['apply', '--whitespace=error', patch]);
  }
  run(process.execPath, ['--check', env.FOUNDRY_TURN_TEST_SOURCE]);
  run(process.execPath, ['--test', path.join(__dirname, 'test/turn-ownership.test.js')]);
} catch (error) {
  console.error(error.message);
  process.exitCode = error.status || 1;
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
