import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.js';

function post(event) {
  return new Request('https://example.com/api/pipeline/run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event })
  });
}

test('health reports API availability without fabricated infrastructure metrics', async () => {
  const response = await worker.fetch(new Request('https://example.com/api/health'), {});
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.edge, 'LOCAL');
  assert.ok(Date.parse(body.timestamp));
});

test('pipeline classifies and routes a critical event', async () => {
  const response = await worker.fetch(post({
    id: 'alert-1', source: 'test', severity: ' CRITICAL ', message: 'CPU threshold'
  }), {});
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.normalized.id, 'alert-1');
  assert.equal(result.normalized.severity, 'critical');
  assert.equal(result.score, 95);
  assert.equal(result.route, 'priority-alerts');
  assert.deepEqual(result.trace.map(step => step.name), ['INGEST', 'NORMALIZE', 'CLASSIFY', 'ROUTE']);
  assert.ok(result.trace.every(step => step.durationMs >= 0));
});

test('low events follow the standard route', async () => {
  const response = await worker.fetch(post({ type: 'heartbeat', severity: 'low' }), {});
  const result = await response.json();
  assert.equal(result.route, 'standard-events');
  assert.equal(result.score, 15);
  assert.equal(result.normalized.type, 'heartbeat');
});

test('invalid JSON and invalid events are rejected', async () => {
  const badJSON = await worker.fetch(new Request('https://example.com/api/pipeline/run', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad'
  }), {});
  assert.equal(badJSON.status, 400);
  const badEvent = await worker.fetch(post([]), {});
  assert.equal(badEvent.status, 422);
});

test('payload size and method rules are enforced', async () => {
  const large = await worker.fetch(post({ message: 'x'.repeat(33000) }), {});
  assert.equal(large.status, 413);
  const wrongMethod = await worker.fetch(new Request('https://example.com/api/pipeline/run'), {});
  assert.equal(wrongMethod.status, 405);
  const unknown = await worker.fetch(new Request('https://example.com/api/other'), {});
  assert.equal(unknown.status, 404);
});

test('non API URLs reach the static asset binding', async () => {
  const response = await worker.fetch(new Request('https://example.com/dashboard'), {
    ASSETS: { fetch: () => new Response('<html>ok</html>', { status: 200 }) }
  });
  assert.equal(await response.text(), '<html>ok</html>');
});
