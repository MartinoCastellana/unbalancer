import { DecisionDiagram, MemoryDiagram, RequestFlowDiagram } from './AnimatedDiagrams.jsx';

const VERSION = '0.0.1';

const algorithms = [
  'Round Robin',
  'Least Connections',
  'EWMA latency',
  'Consistent Hashing',
];

function ArrowUpRight() {
  return <span className="arrow" aria-hidden="true">↗</span>;
}

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Unbalancer home">
          <span className="brand-mark" aria-hidden="true" />
          <span>unbalancer</span>
        </a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#project">Project</a>
          <a href="#how-it-works">How it works</a>
          <a href="#algorithms">Algorithms</a>
          <a href="#repository">Repository</a>
        </nav>
        <div className="header-meta"><span className="version-badge">v{VERSION}</span><a className="header-link" href="#repository">Explore <ArrowUpRight /></a></div>
      </header>

      <main id="top">
        <section className="hero section-pad">
          <div className="eyebrow"><span className="status-dot" /> Adaptive infrastructure / v{VERSION}</div>
          <h1>One system.<br /><em>Every strategy.</em></h1>
          <div className="hero-bottom">
            <p className="hero-copy">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Unbalancer observes the system, chooses the right logic, and keeps learning from every request.</p>
            <a className="lime-button" href="#project">Discover the project <ArrowUpRight /></a>
          </div>
          <div className="hero-grid" aria-hidden="true">
            <span className="grid-label">SYSTEM / ORCHESTRATION / MODEL</span>
            <span className="grid-cross cross-one">+</span>
            <span className="grid-cross cross-two">+</span>
            <div className="signal signal-one" />
            <div className="signal signal-two" />
          </div>
        </section>

        <section id="project" className="project section-pad section-dark">
          <div className="section-intro">
            <span className="section-number">01</span>
            <div><p className="section-kicker">The project</p><h2>Load balancing<br /><span>with memory.</span></h2></div>
          </div>
          <div className="project-content">
            <p className="large-copy">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante. Praesent commodo cursus magna, vel scelerisque nisl consectetur et.</p>
            <div className="stats-row">
              <div><strong>01</strong><span>Decision layer</span></div>
              <div><strong>∞</strong><span>Possible strategies</span></div>
              <div><strong>24/7</strong><span>System awareness</span></div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="how section-pad">
          <div className="section-intro">
            <span className="section-number">02</span>
            <div><p className="section-kicker">How it works</p><h2>Observe.<br />Decide. <em>Adapt.</em></h2></div>
          </div>
          <div className="steps">
            <article className="step"><span>01</span><h3>Observe</h3><p>Lorem ipsum dolor sit amet, latency, sessions and backend health.</p></article>
            <article className="step"><span>02</span><h3>Orchestrate</h3><p>Lorem ipsum dolor sit amet, the SOM reads the current system state.</p></article>
            <article className="step"><span>03</span><h3>Adapt</h3><p>Lorem ipsum dolor sit amet, every outcome becomes part of the memory.</p></article>
          </div>
          <div className="diagram-stack">
            <div className="diagram-card diagram-card-dark"><RequestFlowDiagram /><span>01 / REQUEST PATH</span></div>
            <div className="diagram-card"><DecisionDiagram /><span>02 / POLICY SELECTION</span></div>
            <div className="diagram-card diagram-card-lime"><MemoryDiagram /><span>03 / LEARNING LOOP</span></div>
          </div>
          <div className="flow-line" aria-hidden="true"><span /><span /><span /></div>
        </section>

        <section id="algorithms" className="algorithms section-pad section-lime">
          <div className="section-intro intro-dark">
            <span className="section-number">03</span>
            <div><p className="section-kicker">The toolkit</p><h2>All the tools.<br /><span>One decision.</span></h2></div>
          </div>
          <div className="algorithm-list">
            {algorithms.map((algorithm, index) => (
              <div className="algorithm-item" key={algorithm}>
                <span>0{index + 1}</span><strong>{algorithm}</strong><ArrowUpRight />
              </div>
            ))}
          </div>
        </section>

        <section id="repository" className="repository section-pad section-dark">
          <div className="repository-row">
            <div><p className="section-kicker">Open source / coming soon</p><h2>Built in the open.<br /><em>Follow along.</em></h2></div>
            <a className="lime-button" href="https://github.com" target="_blank" rel="noreferrer">View repository <ArrowUpRight /></a>
          </div>
          <div className="repository-meta"><span>github.com / unbalancer</span><span>Project status: concept</span></div>
        </section>
      </main>

      <footer className="site-footer"><span>© 2026 Unbalancer / v{VERSION}</span><span>Adaptive by design.</span></footer>
    </div>
  );
}

export default App;
