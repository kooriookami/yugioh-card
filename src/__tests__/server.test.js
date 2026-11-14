import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { get } from 'node:http';
import { fileURLToPath } from 'node:url';
import skia from 'skia-canvas';

const requestPage = url => new Promise((resolve, reject) => {
  const request = get(url, response => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.once('error', reject);
    response.once('end', () => resolve({ status: response.statusCode, html: Buffer.concat(chunks).toString() }));
  });
  request.setTimeout(10000, () => request.destroy(new Error('Node demo request timed out')));
  request.once('error', reject);
});

test('dev:node serves the demo with a real local photo through vite-node', { timeout: 30000 }, async t => {
  const child = spawn(process.execPath, [fileURLToPath(import.meta.resolve('vite-node/cli')), '--watch', 'src/server.js'], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)),
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });

  let output = '';
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`dev:node did not start:\n${output}`)), 15000);
    const fail = error => { clearTimeout(timer); reject(error); };
    child.once('error', fail);
    child.once('exit', code => fail(new Error(`dev:node exited (${code}):\n${output}`)));
    child.stderr.on('data', chunk => { output += chunk; });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/server is running at (http:\/\/localhost:\d+)\r?\n/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
  });

  // 首次请求和并发的后续请求都经过真实的 ready、图片加载及 PNG 编码。
  for (const responses of [[await requestPage(url)], await Promise.all([
    requestPage(url),
    requestPage(url),
  ])]) {
    for (const response of responses) {
      assert.equal(response.status, 200, output);
      const match = response.html.match(/^<img src="(data:image\/png;base64,[^"]+)" \/>$/);
      assert.ok(match, 'server returns an embedded PNG');
      const image = await skia.loadImage(match[1]);
      assert.equal(image.width, 1394);
      assert.equal(image.height, 2031);
    }
  }
});
