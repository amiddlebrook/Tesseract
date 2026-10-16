import { useEffect, useState, type ReactNode } from 'react';
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, Check,
  ChevronRight, CircleAlert, Cloud, Code2, Database, Gauge, GitBranch,
  HardDrive, Layers3, Network, Play, Radio, RefreshCw, Route, Server,
  ShieldCheck, Terminal, Workflow, Zap
} from 'lucide-react';

type View = 'overview' | 'topology' | 'pipeline' | 'analytics';
type Health = { status: string; service: string; timestamp: string; edge: string; country: string | null; version: string };
type Trace = { name: string; status: string; durationMs: number };
type Run = {
  runId: string;
  processedAt: string;
  normalized: { id: string; source: string; type: string; severity: string; message: string; attributes: Record<string, unknown> };
  score: number;
  route: string;
  elapsedMs: number;
  edge: string;
  trace: Trace[];
};
const STORE_KEY = 'tesseract.edge.runs.v1';
const SAMPLE_CRITICAL = {
  id: 'evt-production-042', source: 'cloudflare-worker', type: 'threshold.breach',
  severity: 'critical', message: 'Queue latency exceeded target',
  service: 'checkout-api', observed_ms: 846, threshold_ms: 250
};
const SAMPLE_LOW = {
  id: 'evt-healthcheck-018', source: 'edge-scheduler', type: 'heartbeat',
  severity: 'low', message: 'Routine health check completed',
  service: 'event-ingest', healthy: true
};
const NAV_ITEMS = [
  { id: 'overview' as View, name: 'Overview', icon: Layers3, number: '01' },
  { id: 'topology' as View, name: 'Edge topology', icon: Network, number: '02' },
  { id: 'pipeline' as View, name: 'Pipeline lab', icon: Workflow, number: '03' },
  { id: 'analytics' as View, name: 'Analytics', icon: BarChart3, number: '04' }
];
function history(): Run[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(v => v && typeof v.runId === 'string').slice(0, 40) : [];
  } catch { return []; }
}
function clock(value: string): string {
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? '—' : time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function formatMs(value: number | null): string {
  return value === null ? '—' : value.toFixed(value < 1 ? 3 : 1) + 'ms';
}
function severityClass(value: string): string {
  return 'severity severity-' + (['low', 'medium', 'high', 'critical'].includes(value) ? value : 'low');
}
function Panel({ title, eyebrow, children, action, className = '' }: {
  title: string; eyebrow?: string; children: ReactNode; action?: ReactNode; className?: string;
}) {
  return <section className={'panel ' + className}>
    <div className="panel-heading"><div><p className="eyebrow">{eyebrow || 'CONTROL MODULE'}</p><h3>{title}</h3></div>{action}</div>
    {children}
  </section>;
}
function Stat({ label, value, detail, icon: Icon, accent = false }: {
  label: string; value: string; detail: string; icon: typeof Activity; accent?: boolean;
}) {
  return <div className={'stat-card' + (accent ? ' stat-accent' : '')}>
    <div className="stat-top"><span>{label}</span><Icon size={17} aria-hidden="true" /></div>
    <div className="stat-value">{value}</div><span className="stat-detail">{detail}</span>
  </div>;
}
function RunChart({ runs }: { runs: Run[] }) {
  const points = [...runs].reverse().slice(-12);
  const maxValue = Math.max(1, ...points.map(v => v.elapsedMs));
  const coordinates = points.map((v, i) => {
    const x = points.length === 1 ? 40 : 40 + i * (620 / (points.length - 1));
    const y = 198 - (v.elapsedMs / maxValue) * 147;
    return { x, y, run: v };
  });
  return <div className="chart-container">
    <div className="chart-meta"><span><span className="legend-dot" /> WORKER PROCESSING TIME</span><span>LAST {points.length} RUNS</span></div>
    <svg viewBox="0 0 700 236" role="img" aria-label="Worker processing time for recent events" preserveAspectRatio="none">
      {[50,100,150,200].map(y => <line key={y} x1="36" x2="665" y1={y} y2={y} stroke="#263548" strokeDasharray="4 5" />)}
      {points.length > 0 && <polyline fill="none" stroke="#66e2be" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={coordinates.map(p => p.x + ',' + p.y).join(' ')} />}
      {coordinates.map(p => <circle key={p.run.runId} cx={p.x} cy={p.y} r="4.5" stroke="#0c1726" strokeWidth="2" fill="#66e2be"><title>{formatMs(p.run.elapsedMs)}</title></circle>)}
      <text x="8" y="52" fontSize="12" fill="#728397">{maxValue.toFixed(2)}</text>
      <text x="8" y="202" fontSize="12" fill="#728397">0</text>
    </svg>
    {points.length === 0 && <div className="chart-empty"><Activity size={23} /><strong>No events processed yet</strong><span>Run a sample event to populate live metrics.</span></div>}
  </div>;
}
function RunTable({ runs, empty = 'No pipeline activity yet.' }: { runs: Run[]; empty?: string }) {
  if (!runs.length) return <div className="empty-row">{empty}</div>;
  return <div className="table-scroll"><table className="event-table">
    <thead><tr><th>EVENT</th><th>SEVERITY</th><th>ROUTE</th><th>TIME</th></tr></thead>
    <tbody>{runs.map(run => <tr key={run.runId}>
      <td><div className="event-name">{run.normalized.type}</div><div className="event-id">{run.normalized.id}</div></td>
      <td><span className={severityClass(run.normalized.severity)}>{run.normalized.severity}</span></td>
      <td><span className="route-value">{run.route}</span></td>
      <td className="mono subdued">{clock(run.processedAt)}</td>
    </tr>)}</tbody>
  </table></div>;
}

export default function App() {
  const [view, setView] = useState<View>('overview');
  const [runs, setRuns] = useState<Run[]>(history);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState('');
  const [networkMs, setNetworkMs] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [payload, setPayload] = useState(JSON.stringify(SAMPLE_CRITICAL, null, 2));
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState('');
  const [latest, setLatest] = useState<Run | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(runs)); }, [runs]);

  async function refreshHealth() {
    setChecking(true);
    const start = performance.now();
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) throw new Error('Health endpoint returned HTTP ' + response.status);
      const result = await response.json() as Health;
      if (result.status !== 'ok') throw new Error('Unexpected health response');
      setHealth(result);
      setNetworkMs(performance.now() - start);
      setHealthError('');
    } catch (error) {
      setHealth(null);
      setNetworkMs(null);
      setHealthError(error instanceof Error ? error.message : 'Connection failed');
    } finally { setChecking(false); }
  }
  useEffect(() => { void refreshHealth(); }, []);

  async function runPipeline() {
    setRunError('');
    let event: unknown;
    try {
      event = JSON.parse(payload);
      if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Payload must be a JSON object');
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Invalid JSON');
      return;
    }
    setRunning(true);
    try {
      const response = await fetch('/api/pipeline/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Execution failed');
      const result = body as Run;
      setLatest(result);
      setRuns(previous => [result, ...previous].slice(0, 40));
      setView('pipeline');
      void refreshHealth();
    } catch (error) {
      setRunError(error instanceof Error ? error.message : 'Could not reach the Worker');
    } finally { setRunning(false); }
  }
  async function copyOutput() {
    if (!latest) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(latest, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { setRunError('Clipboard access was blocked by the browser.'); }
  }
  function exportHistory() {
    const blob = new Blob([JSON.stringify(runs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'tesseract-runs.json'; anchor.click();
    URL.revokeObjectURL(url);
  }
  const alerts = runs.filter(r => r.route === 'priority-alerts').length;
  const avgTime = runs.length ? runs.reduce((sum, r) => sum + r.elapsedMs, 0) / runs.length : null;
  const counts = ['critical', 'high', 'medium', 'low'].map(severity => ({
    severity, count: runs.filter(r => r.normalized.severity === severity).length
  }));
  const pageTitle = NAV_ITEMS.find(item => item.id === view)?.name || 'Overview';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-symbol"><span className="brand-cube">⬡</span></span>
        <span className="brand-copy"><strong>TESSERACT</strong><small>EDGE CONTROL PLANE</small></span>
      </div>
      <div className="side-section-title">WORKSPACE <span>01 / 01</span></div>
      <nav className="nav-list" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, name, icon: Icon, number }) => <button type="button" key={id}
          className={'nav-item' + (view === id ? ' selected' : '')}
          aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>
          <Icon size={18} /><span>{name}</span><small>{number}</small>
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-status"><div className={'signal-light' + (health ? ' on' : '')} />
          <div><strong>{health ? 'Worker connected' : 'Worker disconnected'}</strong><span>{health ? 'Edge API responding' : 'Check local worker or deploy'}</span></div>
        </div>
        <div className="side-footer"><span>VERSION 1.0.0</span><span>BUILT ON CLOUDFLARE</span></div>
      </div>
    </aside>
    <div className="workspace">
      <header className="topbar">
        <div className="breadcrumbs"><span>WORKSPACE</span><ChevronRight size={13} /><strong>{pageTitle.toUpperCase()}</strong></div>
        <div className="top-actions">
          <span className="top-time">LOCAL SESSION</span>
          <span className={'status-pill' + (health ? ' available' : '')}><span className="status-circle" />{health ? 'EDGE ONLINE' : 'EDGE OFFLINE'}</span>
          <button className="icon-button" type="button" onClick={() => void refreshHealth()} disabled={checking} title="Refresh edge connection" aria-label="Refresh edge connection"><RefreshCw className={checking ? 'spin' : ''} size={17}/></button>
        </div>
      </header>
      <main className="main-content">
        <div className="page-intro">
          <div><p className="eyebrow top-eyebrow"><span className="small-square" /> OPERATIONS / {view.toUpperCase()}</p>
            <h1>{view === 'overview' ? 'Command overview' : pageTitle}</h1>
            <p className="intro-description">{view === 'overview' ? 'Inspect, execute, and understand your event-processing flow in real time.' :
              view === 'topology' ? 'Your actual edge connection, processing path, and service diagnostics.' :
              view === 'pipeline' ? 'Submit JSON events to the Cloudflare Worker and inspect every processing stage.' :
              'Operational insights calculated from events processed in this browser.'}</p>
          </div>
          <div className="intro-actions">
            {view !== 'pipeline' && <button type="button" className="button primary" onClick={() => setView('pipeline')}><Play size={15} fill="currentColor"/> Open pipeline lab <ArrowUpRight size={15}/></button>}
            {view === 'analytics' && <button type="button" className="button muted" onClick={exportHistory} disabled={!runs.length}><ArrowDownToLine size={16}/> Export</button>}
          </div>
        </div>

        {view === 'overview' && <>
          <div className="stats-grid">
            <Stat label="TOTAL EXECUTIONS" value={String(runs.length)} detail="Saved in this browser" icon={Activity} accent />
            <Stat label="PRIORITY ALERTS" value={String(alerts)} detail="High + critical routed" icon={CircleAlert} />
            <Stat label="AVG PROCESS TIME" value={formatMs(avgTime)} detail="Worker execution time" icon={Gauge} />
            <Stat label="ACTIVE EDGE" value={health?.edge || '—'} detail={health ? 'Verified by health API' : 'Not connected'} icon={Cloud} />
          </div>
          <div className="content-grid">
            <div className="content-primary">
              <Panel title="Execution performance" eyebrow="01 / OBSERVABILITY" action={<span className="panel-tag"><span className="signal-light on"/> EVENT-SOURCED</span>}><RunChart runs={runs} /></Panel>
              <Panel title="Recent executions" eyebrow="02 / EVENT HISTORY" action={<button type="button" className="text-button" onClick={() => setView('analytics')}>View analytics <ArrowRight size={15}/></button>}><RunTable runs={runs.slice(0, 5)} /></Panel>
            </div>
            <div className="content-secondary">
              <Panel title="Edge diagnostics" eyebrow="03 / CONNECTIVITY" className="compact-panel">
                <div className="connection-banner"><span className={'connection-icon' + (health ? ' healthy' : '')}><Server size={23}/></span><div><strong>{health ? 'All systems operational' : 'Connection unavailable'}</strong><span>{health ? 'Live response from Worker API' : 'The Worker API is not responding'}</span></div></div>
                <div className="kv-row"><span>Service</span><strong>{health?.service || 'Tesseract Edge'}</strong></div>
                <div className="kv-row"><span>Edge location</span><strong>{health?.edge || '—'}</strong></div>
                <div className="kv-row"><span>Round-trip time</span><strong>{formatMs(networkMs)}</strong></div>
                <div className="kv-row"><span>Last checked</span><strong>{health ? clock(health.timestamp) : '—'}</strong></div>
                {healthError && <p className="inline-error">{healthError}</p>}
                <button type="button" className="button border-button full" disabled={checking} onClick={() => void refreshHealth()}><RefreshCw size={15} className={checking ? 'spin' : ''}/> Re-run diagnostics</button>
              </Panel>
              <Panel title="Processing lifecycle" eyebrow="04 / PIPELINE">
                <div className="lifecycle">{[['01','Ingest','Accept JSON payload'], ['02','Normalize','Validate and structure'], ['03','Classify','Score event severity'], ['04','Route','Select output channel']].map((step,i) =>
                  <div className="lifecycle-step" key={step[0]}><div className="step-rail"><span>{step[0]}</span>{i < 3 && <div/>}</div><div><strong>{step[1]}</strong><small>{step[2]}</small></div><Check size={15}/></div>)}</div>
                <button type="button" className="text-button bottom-link" onClick={() => setView('pipeline')}>Open interactive pipeline <ArrowUpRight size={16}/></button>
              </Panel>
            </div>
          </div>
        </>}

        {view === 'topology' && <div className="topology-layout">
          <Panel title="Request journey" eyebrow="01 / LIVE ARCHITECTURE" action={<span className="panel-tag">4 STAGES</span>}>
            <p className="panel-description">An actual Cloudflare-native request path. Only the connected edge location and measured latency come from the network; pipeline routing is deterministic Worker logic.</p>
            <div className="topology-flow">
              <div className="topology-node"><span className="topology-icon"><Code2 size={24}/></span><span className="node-tag">CLIENT</span><h3>Browser</h3><p>JSON submission<br/>and local history</p></div>
              <span className="flow-arrow"><ArrowRight size={22}/></span>
              <div className="topology-node featured"><span className="topology-icon"><Cloud size={24}/></span><span className="node-tag">CLOUDFLARE EDGE</span><h3>{health?.edge || 'Unresolved'}</h3><p>Worker API<br/>{health ? 'Healthy connection' : 'Not connected'}</p></div>
              <span className="flow-arrow"><ArrowRight size={22}/></span>
              <div className="topology-node"><span className="topology-icon"><GitBranch size={24}/></span><span className="node-tag">COMPUTE</span><h3>Rules engine</h3><p>Validate, normalize<br/>and classify</p></div>
              <span className="flow-arrow"><ArrowRight size={22}/></span>
              <div className="topology-node"><span className="topology-icon"><Route size={24}/></span><span className="node-tag">OUTPUT</span><h3>Event route</h3><p>Priority alerts<br/>or standard queue</p></div>
            </div>
          </Panel>
          <div className="two-panels">
            <Panel title="Connection probe" eyebrow="02 / HEALTH CHECK">
              <div className="probe-status"><span className={'large-light' + (health ? ' connected' : '')}/><div><strong>{health ? 'API connected' : 'API unreachable'}</strong><span>{health ? 'Response validated against /api/health' : 'Check your Worker setup'}</span></div></div>
              <div className="kv-row"><span>Endpoint</span><strong className="mono">GET /api/health</strong></div>
              <div className="kv-row"><span>Cloudflare colocation</span><strong>{health?.edge || '—'}</strong></div>
              <div className="kv-row"><span>Country</span><strong>{health?.country || 'Not available'}</strong></div>
              <div className="kv-row"><span>Round trip</span><strong>{formatMs(networkMs)}</strong></div>
              <button type="button" className="button primary" onClick={() => void refreshHealth()} disabled={checking}><RefreshCw size={16} className={checking ? 'spin' : ''}/> Run probe</button>
              {healthError && <p className="inline-error">{healthError}</p>}
            </Panel>
            <Panel title="Deployment model" eyebrow="03 / INFRASTRUCTURE">
              <div className="deployment-line"><span><Cloud size={17}/></span><div><strong>Cloudflare Workers</strong><small>Single edge Worker + static assets</small></div><Check size={17}/></div>
              <div className="deployment-line"><span><ShieldCheck size={17}/></span><div><strong>GitHub Actions</strong><small>Type-check, tests, build and deploy</small></div><Check size={17}/></div>
              <div className="deployment-line"><span><Database size={17}/></span><div><strong>Browser history</strong><small>Local storage — no database charges</small></div><Check size={17}/></div>
              <p className="footnote">Metrics are from this device's saved executions, not an account-wide telemetry service.</p>
            </Panel>
          </div>
        </div>}

        {view === 'pipeline' && <div className="pipeline-grid">
          <Panel title="Event payload" eyebrow="01 / INPUT CONFIGURATION" action={<span className="panel-tag">JSON</span>}>
            <p className="panel-description">Submit a valid JSON object. The server validates it and returns a normalized event, severity score, route, and per-stage timings.</p>
            <div className="editor-top"><span><span className="editor-light"/> event.json</span><span>MAX 32 KB</span></div>
            <textarea className="code-editor" aria-label="JSON event payload" spellCheck={false} value={payload} onChange={event => setPayload(event.target.value)} />
            <div className="editor-buttons">
              <button type="button" className="button muted" onClick={() => setPayload(JSON.stringify(SAMPLE_CRITICAL, null, 2))}>Critical sample</button>
              <button type="button" className="button muted" onClick={() => setPayload(JSON.stringify(SAMPLE_LOW, null, 2))}>Low sample</button>
            </div>
            {runError && <div className="error-box" role="alert"><CircleAlert size={17}/>{runError}</div>}
            <button type="button" className="button primary full run-action" onClick={() => void runPipeline()} disabled={running}>
              <Play size={16} fill="currentColor"/>{running ? 'Executing...' : 'Execute pipeline'}<ArrowRight size={16}/>
            </button>
            <p className="footnote">No paid APIs, no API keys, and no server-side retention of submitted events.</p>
          </Panel>
          <div className="pipeline-output">
            <Panel title="Execution trace" eyebrow="02 / RUNTIME" action={latest && <span className="success-tag"><Check size={14}/> COMPLETED</span>}>
              {!latest ? <div className="trace-empty"><Terminal size={32}/><strong>Ready for your first run</strong><p>Execute an event to inspect the real Worker response and processing stages.</p></div> :
                <>
                  <div className="run-summary"><div><span>EXECUTION TIME</span><strong>{formatMs(latest.elapsedMs)}</strong></div><div><span>CLASSIFICATION SCORE</span><strong>{latest.score}<small>/100</small></strong></div></div>
                  <div className="trace-list">{latest.trace.map((step,i) => <div className="trace-step" key={i}><span className="trace-number">{String(i+1).padStart(2,'0')}</span><span className="trace-name">{step.name}</span><span className="trace-time">{formatMs(step.durationMs)}</span><Check size={15}/></div>)}</div>
                  <div className="route-result"><span>DESTINATION ROUTE</span><strong><Route size={16}/>{latest.route}</strong></div>
                </>}
            </Panel>
            <Panel title="Worker response" eyebrow="03 / OUTPUT" action={<button type="button" className="text-button" disabled={!latest} onClick={() => void copyOutput()}>{copied ? <Check size={15}/> : <Code2 size={15}/>} {copied ? 'Copied' : 'Copy JSON'}</button>}>
              <pre className="response-code">{latest ? JSON.stringify(latest, null, 2) : '// Execute a pipeline to see the full JSON response.'}</pre>
            </Panel>
          </div>
        </div>}

        {view === 'analytics' && <>
          <div className="stats-grid">
            <Stat label="TOTAL EXECUTIONS" value={String(runs.length)} detail="Up to 40 stored locally" icon={Activity} accent/>
            <Stat label="PRIORITY ALERTS" value={String(alerts)} detail="Routed to priority alerts" icon={CircleAlert}/>
            <Stat label="AVG WORKER TIME" value={formatMs(avgTime)} detail="Measured in Worker" icon={Gauge}/>
            <Stat label="SUCCESSFUL EXECUTIONS" value={String(runs.length)} detail="Completed API responses" icon={ShieldCheck}/>
          </div>
          <div className="two-panels">
            <Panel title="Severity distribution" eyebrow="01 / CLASSIFICATION">
              <div className="severity-breakdown">{counts.map(item => <div key={item.severity} className="severity-bar-row"><span className={severityClass(item.severity)}>{item.severity}</span><div className="bar-track"><div className={'bar-fill bar-' + item.severity} style={{width: runs.length ? (item.count / runs.length * 100) + '%' : '0%'}}/></div><strong>{item.count}</strong></div>)}</div>
              <p className="footnote">Based solely on executed events in this browser, with no synthetic entries.</p>
            </Panel>
            <Panel title="Routing outcomes" eyebrow="02 / DISPATCH RESULTS">
              <div className="route-stat"><div><span>PRIORITY ALERTS</span><strong>{alerts}</strong></div><span className="route-dot alert"/></div>
              <div className="route-stat"><div><span>STANDARD EVENTS</span><strong>{runs.length - alerts}</strong></div><span className="route-dot standard"/></div>
              <div className="progress-split"><span style={{ width: runs.length ? (alerts/runs.length*100)+'%' : '0%' }}/></div>
              <p className="footnote">Critical and high severity events follow the priority-alerts route.</p>
            </Panel>
          </div>
          <div className="analytics-bottom"><Panel title="Processing latency" eyebrow="03 / TIMING"><RunChart runs={runs}/></Panel></div>
          <Panel title="Execution history" eyebrow="04 / AUDIT TRAIL" action={<button type="button" className="text-button" onClick={exportHistory} disabled={!runs.length}><ArrowDownToLine size={15}/> Export JSON</button>}><RunTable runs={runs}/></Panel>
        </>}

        <footer className="content-footer"><span><Zap size={14}/> TESSERACT / EDGE CONTROL PLANE</span><span>100% CLOUDFLARE NATIVE · LOCAL-FIRST TELEMETRY</span></footer>
      </main>
    </div>
  </div>;
}
