import { useEffect, useMemo, useState } from 'react';

const VERSION = '0.0.1';

const scenarios = {
  stable: { label: 'Stable traffic', description: 'Balanced traffic with healthy backends.', rate: 182, latency: 82 },
  burst: { label: 'Burst traffic', description: 'A short, high-volume traffic spike.', rate: 640, latency: 164 },
  slow: { label: 'Slow backend', description: 'Server 02 develops sustained high latency.', rate: 310, latency: 238 },
  recovery: { label: 'Backend recovery', description: 'A degraded backend gradually returns to service.', rate: 240, latency: 128 },
};

const initialBackends = [
  { id: 'server-01', zone: 'eu-west / a', active: 34, latency: 72, error: 0.3, priority: 1, state: 'healthy' },
  { id: 'server-02', zone: 'eu-west / b', active: 41, latency: 88, error: 0.8, priority: 1, state: 'healthy' },
  { id: 'server-03', zone: 'eu-west / c', active: 27, latency: 64, error: 0.2, priority: 1, state: 'healthy' },
  { id: 'server-04', zone: 'eu-west / d', active: 52, latency: 106, error: 1.1, priority: 2, state: 'degraded' },
];

const initialState = {
  tick: 0,
  scenario: 'stable',
  running: true,
  algorithm: 'weighted_least_connections',
  model: 'qwen3:0.6b',
  requests: 18420,
  completed: 18102,
  errors: 68,
  avgLatency: 84,
  p95: 146,
  throughput: 182,
  backends: initialBackends,
  history: [74, 78, 76, 81, 84, 82, 86, 83, 84, 88, 84, 86],
  logs: [
    { time: '12:41:08', type: 'policy', message: 'Weighted least connections kept active' },
    { time: '12:40:56', type: 'session', message: 'Session sess_84af completed in 71ms' },
    { time: '12:40:42', type: 'health', message: 'server-04 marked degraded · p95 > threshold' },
    { time: '12:40:17', type: 'policy', message: 'SOM evaluated 4 routing strategies' },
  ],
};

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

function Sparkline({ values, color = '#81ff45' }) {
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const min = Math.min(...values) - 5;
    const max = Math.max(...values) + 5;
    const y = 100 - ((value - min) / Math.max(max - min, 1)) * 100;
    return `${x},${y}`;
  }).join(' ');
  return <svg className="sparkline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>;
}

function StatusDot({ state = 'healthy' }) {
  return <span className={`status-dot ${state}`} aria-label={state} />;
}

function App() {
  const [sim, setSim] = useState(initialState);

  useEffect(() => {
    if (!sim.running) return undefined;
    const timer = window.setInterval(() => {
      setSim((previous) => {
        const nextTick = previous.tick + 1;
        const scenario = scenarios[previous.scenario];
        const wave = Math.sin(nextTick / 2.5) * 9;
        const isSlow = previous.scenario === 'slow';
        const isBurst = previous.scenario === 'burst';
        const isRecovery = previous.scenario === 'recovery';
        const recovery = Math.min(nextTick * 2.5, 55);
        const backends = previous.backends.map((backend, index) => {
          const baseline = [72, 88, 64, 106][index];
          const slowPenalty = isSlow && index === 1 ? 520 + Math.sin(nextTick) * 60 : 0;
          const recoveryPenalty = isRecovery && index === 3 ? Math.max(20, 220 - recovery) : 0;
          const latency = Math.max(28, Math.round(baseline + wave + slowPenalty + recoveryPenalty));
          const active = Math.max(8, Math.round(backend.active + (Math.sin(nextTick + index) * 7) + (isBurst ? 16 : 0) - (latency > 300 ? 5 : 0)));
          const degraded = latency > 260 || (isSlow && index === 1);
          return { ...backend, active, latency, error: degraded ? 6.4 : Math.max(.1, Number((backend.error + Math.sin(nextTick + index) * .18).toFixed(1))), priority: degraded ? 4 : (isRecovery && index === 3 ? 2 : 1), state: degraded ? 'degraded' : 'healthy' };
        });
        const avgLatency = Math.round(backends.reduce((sum, backend) => sum + backend.latency, 0) / backends.length);
        const p95 = Math.round(Math.max(avgLatency + 54, ...backends.map((backend) => backend.latency * 1.15)));
        const errors = Math.max(0, Math.round(previous.errors + (isSlow ? .8 : .1) + Math.sin(nextTick) * .7));
        const algorithm = isSlow && nextTick % 4 !== 0 ? 'power_of_two_choices' : isBurst ? 'least_connections' : isRecovery ? 'weighted_round_robin' : 'weighted_least_connections';
        const changed = algorithm !== previous.algorithm;
        const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const event = changed
          ? { time, type: 'policy', message: `SOM switched to ${algorithm.replaceAll('_', ' ')}` }
          : { time, type: isSlow ? 'health' : 'session', message: isSlow ? 'server-02 latency signal added to journal' : `Session sess_${String(nextTick).padStart(4, '0')} completed in ${Math.max(40, avgLatency - 9)}ms` };
        return {
          ...previous,
          tick: nextTick,
          requests: previous.requests + Math.round(scenario.rate / 3),
          completed: previous.completed + Math.round((scenario.rate / 3) * .98),
          errors,
          avgLatency,
          p95,
          throughput: Math.round(scenario.rate + wave),
          algorithm,
          backends,
          history: [...previous.history.slice(-23), avgLatency],
          logs: [event, ...previous.logs].slice(0, 7),
        };
      });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [sim.running]);

  const scenario = scenarios[sim.scenario];
  const healthyCount = sim.backends.filter((backend) => backend.state === 'healthy').length;
  const selectedBackend = useMemo(() => sim.backends.reduce((best, backend) => backend.latency < best.latency ? backend : best, sim.backends[0]), [sim.backends]);

  function changeScenario(event) {
    const nextScenario = event.target.value;
    setSim((previous) => ({ ...previous, scenario: nextScenario, logs: [{ time: 'now', type: 'system', message: `${scenarios[nextScenario].label} scenario loaded` }, ...previous.logs] }));
  }

  function reset() {
    setSim({ ...initialState, backends: initialBackends.map((backend) => ({ ...backend })), running: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo"><span className="logo-mark" />unbalancer</div>
        <div className="side-label">Simulation workspace</div>
        <nav className="side-nav">
          <a className="active" href="#overview"><span>◫</span> Overview</a>
          <a href="#backends"><span>◌</span> Backends</a>
          <a href="#journal"><span>↳</span> Decision journal</a>
          <a href="#benchmarks"><span>⌁</span> Benchmarks</a>
        </nav>
        <div className="sidebar-bottom"><span className="mini-dot" /> Simulator mode <strong>v{VERSION}</strong></div>
      </aside>

      <main className="dashboard" id="overview">
        <header className="topbar"><div><span className="breadcrumb">UNBALANCER / SIMULATOR</span><h1>System overview</h1></div><div className="top-actions"><span className="model-chip"><span className="live-dot" /> Ollama / {sim.model}</span><button className="icon-button" onClick={reset} title="Reset simulation">↻</button><button className="user-button">MC</button></div></header>

        <section className="control-strip">
          <div><span className="control-label">Simulation scenario</span><select value={sim.scenario} onChange={changeScenario}>{Object.entries(scenarios).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select><p>{scenario.description}</p></div>
          <div className="run-controls"><span className={`run-state ${sim.running ? 'is-running' : ''}`}><i /> {sim.running ? 'Running simulation' : 'Simulation paused'}</span><button className="control-button" onClick={() => setSim((previous) => ({ ...previous, running: !previous.running }))}>{sim.running ? 'Pause' : 'Resume'}</button></div>
        </section>

        <section className="metric-grid">
          <article className="metric-card accent"><span>Requests / sec</span><strong>{formatNumber(sim.throughput)}</strong><small>+12.4% vs baseline</small><Sparkline values={sim.history.map((value) => value * 1.9)} /></article>
          <article className="metric-card"><span>Average latency</span><strong>{sim.avgLatency}<small>ms</small></strong><small className={sim.avgLatency > 180 ? 'warning' : ''}>{sim.avgLatency > 180 ? 'Elevated signal' : 'Within target range'}</small><Sparkline values={sim.history} color={sim.avgLatency > 180 ? '#ff8b55' : '#81ff45'} /></article>
          <article className="metric-card"><span>p95 latency</span><strong>{sim.p95}<small>ms</small></strong><small>{formatNumber(sim.completed)} completed sessions</small><Sparkline values={sim.history.map((value) => value + 45)} color="#8e8e98" /></article>
          <article className="metric-card"><span>Active backends</span><strong>{healthyCount}<small> / {sim.backends.length}</small></strong><small>{sim.errors} recorded errors</small><div className="backend-bars">{sim.backends.map((backend) => <i key={backend.id} className={backend.state} style={{ height: `${Math.min(100, backend.active)}%` }} />)}</div></article>
        </section>

        <section className="main-grid">
          <article className="panel decision-panel"><div className="panel-heading"><div><span className="eyebrow">Current decision</span><h2>{sim.algorithm.replaceAll('_', ' ')}</h2></div><span className="decision-badge">SOM active</span></div><div className="decision-visual"><div className="decision-core"><span>Policy</span><strong>0{(sim.tick % 9) + 1}</strong></div><div className="decision-ring ring-a" /><div className="decision-ring ring-b" /><span className="orbit-label label-a">latency</span><span className="orbit-label label-b">sessions</span><span className="orbit-label label-c">errors</span><span className="orbit-label label-d">capacity</span></div><div className="decision-footer"><span>Selected backend</span><strong>{selectedBackend.id}</strong><span className="decision-score">score {Math.max(.42, 1 - (selectedBackend.latency / 1000)).toFixed(2)}</span></div></article>
          <article className="panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">Live telemetry</span><h2>Latency signal</h2></div><span className="time-window">last 24 ticks</span></div><div className="chart"><div className="chart-y"><span>500</span><span>250</span><span>0</span></div><Sparkline values={sim.history} color={sim.avgLatency > 180 ? '#ff8b55' : '#81ff45'} /><div className="chart-x"><span>−24s</span><span>now</span></div></div><div className="chart-legend"><span><i className="legend-lime" /> observed latency</span><span><i className="legend-gray" /> threshold 500ms</span></div></article>
        </section>

        <section className="lower-grid" id="backends">
          <article className="panel backend-panel"><div className="panel-heading"><div><span className="eyebrow">Runtime state</span><h2>Backend pool</h2></div><span className="panel-count">{sim.backends.length} nodes</span></div><div className="backend-table"><div className="table-head"><span>Backend</span><span>Active</span><span>Latency</span><span>Priority</span></div>{sim.backends.map((backend) => <div className="backend-row" key={backend.id}><span><StatusDot state={backend.state} /><strong>{backend.id}</strong><small>{backend.zone}</small></span><span>{backend.active}</span><span className={backend.latency > 260 ? 'warning' : ''}>{backend.latency}ms</span><span className={backend.priority > 1 ? 'priority-low' : ''}>{backend.priority === 1 ? 'normal' : `low · ${backend.priority}`}</span></div>)}</div></article>
          <article className="panel journal-panel" id="journal"><div className="panel-heading"><div><span className="eyebrow">Trace</span><h2>Decision journal</h2></div><span className="panel-count">live</span></div><div className="journal-list">{sim.logs.map((log, index) => <div className="journal-entry" key={`${log.time}-${index}`}><span className={`journal-icon ${log.type}`}>{log.type === 'policy' ? '↗' : log.type === 'health' ? '!' : '·'}</span><p><strong>{log.message}</strong><small>{log.time} / {log.type}</small></p></div>)}</div></article>
        </section>
        <footer className="dashboard-footer"><span>Simulation data is synthetic / not connected to production.</span><span>Unbalancer v{VERSION}</span></footer>
      </main>
    </div>
  );
}

export default App;
