import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(readFileSync(new URL('../../src/common/tauri-bridge.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const flush = () => new Promise(resolve => setImmediate(resolve));

function bridge() {
  let register, recover, handler;
  const calls = [];
  let stopped = 0;
  const exports = {};
  vm.runInNewContext(source, { exports, console, require: name => name.endsWith('/core') ? {
    isTauri: () => true,
    invoke: command => { calls.push(command); return new Promise(resolve => { recover = resolve; }); },
  } : {
    listen: (_name, callback) => { handler = callback; return new Promise(resolve => { register = () => resolve(() => stopped++); }); },
  } });
  return {
    api: exports.tauriBridge, calls,
    register: () => register(), recover: files => recover(files),
    emit: files => handler({ payload: files }), stopped: () => stopped,
  };
}
const first = [{ name: 'first.png', ext: 'png', category: 'image' }];
const second = [{ name: 'second.mp4', ext: 'mp4', category: 'video' }];

test('first drag is recovered after asynchronous listener registration', async () => {
  const mock = bridge(), seen = [];
  const stop = mock.api.onNativeDragEnter(files => seen.push(files));
  assert.equal(mock.calls.length, 0);
  mock.register(); await flush();
  assert.deepEqual(mock.calls, ['current_native_drag']);
  mock.recover(first); await flush();
  assert.deepEqual(seen, [first]);
  stop(); assert.equal(mock.stopped(), 1);
});

test('late recovery cannot replace a newer live drag', async () => {
  const mock = bridge(), seen = [];
  const stop = mock.api.onNativeDragEnter(files => seen.push(files));
  mock.register(); await flush();
  mock.emit(second); mock.recover(first); await flush();
  assert.deepEqual(seen, [second]); stop();
});

test('unmounted listener is removed even when registration completes late', async () => {
  const mock = bridge(), seen = [];
  const stop = mock.api.onNativeDragEnter(files => seen.push(files));
  stop(); mock.register(); await flush(); mock.emit(first);
  assert.equal(mock.stopped(), 1);
  assert.deepEqual(mock.calls, []);
  assert.deepEqual(seen, []);
});
