const MAX_PAYLOAD_BYTES = 32768;
const SCORES = { low: 15, medium: 45, high: 75, critical: 95 };

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function textValue(value, fallback, limit = 240) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, limit) : fallback;
}

function execute(event, request) {
  const trace = [];
  const started = performance.now();
  const stage = (name, callback) => {
    const at = performance.now();
    const output = callback();
    trace.push({ name, status: 'complete', durationMs: +(performance.now() - at).toFixed(3) });
    return output;
  };
  stage('INGEST', () => Object.keys(event).length);
  const normalized = stage('NORMALIZE', () => {
    const raw = textValue(event.severity ?? event.level, 'low', 20).toLowerCase();
    return {
      id: textValue(event.id, crypto.randomUUID(), 120),
      source: textValue(event.source, 'manual-input', 120),
      type: textValue(event.type, 'event', 120),
      severity: Object.hasOwn(SCORES, raw) ? raw : 'low',
      message: textValue(event.message, 'Event processed successfully', 1000),
      attributes: event
    };
  });
  const score = stage('CLASSIFY', () => SCORES[normalized.severity]);
  const route = stage('ROUTE', () => score >= 75 ? 'priority-alerts' : 'standard-events');
  return {
    runId: crypto.randomUUID(),
    processedAt: new Date().toISOString(),
    normalized,
    score,
    route,
    trace,
    elapsedMs: +(performance.now() - started).toFixed(3),
    edge: request.cf?.colo || 'LOCAL'
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      return json({
        status: 'ok', service: 'Tesseract Edge',
        timestamp: new Date().toISOString(),
        edge: request.cf?.colo || 'LOCAL',
        country: request.cf?.country || null, version: '1.0.0'
      });
    }
    if (url.pathname === '/api/pipeline/run') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json'))
        return json({ error: 'Content-Type must be application/json' }, 415);
      const declaredBytes = Number(request.headers.get('content-length') || 0);
      if (declaredBytes > MAX_PAYLOAD_BYTES) return json({ error: 'Payload exceeds 32 KB' }, 413);
      let data;
      try {
        const raw = await request.text();
        if (new TextEncoder().encode(raw).byteLength > MAX_PAYLOAD_BYTES)
          return json({ error: 'Payload exceeds 32 KB' }, 413);
        data = JSON.parse(raw);
      } catch {
        return json({ error: 'Malformed JSON' }, 400);
      }
      if (!data || typeof data !== 'object' || !data.event ||
          typeof data.event !== 'object' || Array.isArray(data.event) ||
          Object.keys(data.event).length > 100)
        return json({ error: 'Expected an event object with at most 100 fields' }, 422);
      return json(execute(data.event, request));
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'Unknown endpoint' }, 404);
    if (env?.ASSETS?.fetch) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};
