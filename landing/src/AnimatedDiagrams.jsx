export function RequestFlowDiagram() {
  return (
    <svg className="animated-svg" viewBox="0 0 760 190" role="img" aria-label="A request moving from a client through the SOM to a backend">
      <defs>
        <linearGradient id="flow-gradient" x1="0" x2="1">
          <stop offset="0" stopColor="#81ff45" stopOpacity="0" />
          <stop offset=".5" stopColor="#81ff45" />
          <stop offset="1" stopColor="#81ff45" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="svg-track" d="M112 95H268M492 95h156" />
      <path className="svg-pulse-line" d="M112 95H268M492 95h156" />
      <circle className="svg-packet packet-one" cx="130" cy="95" r="5" />
      <circle className="svg-packet packet-two" cx="130" cy="95" r="5" />
      <g className="svg-node" transform="translate(24 58)"><rect width="88" height="74" rx="2" /><text x="44" y="32">CLIENT</text><text className="svg-node-sub" x="44" y="51">request</text></g>
      <g className="svg-node svg-node-highlight" transform="translate(268 40)"><rect width="224" height="110" rx="3" /><text x="112" y="42">SOM</text><text className="svg-node-sub" x="112" y="63">observe / decide</text><circle cx="112" cy="87" r="6" /></g>
      <g className="svg-node" transform="translate(648 58)"><rect width="88" height="74" rx="2" /><text x="44" y="32">BACKEND</text><text className="svg-node-sub" x="44" y="51">response</text></g>
      <text className="svg-caption" x="380" y="179">REQUEST FLOW / LIVE POLICY</text>
    </svg>
  );
}

export function DecisionDiagram() {
  return (
    <svg className="animated-svg" viewBox="0 0 760 230" role="img" aria-label="The SOM choosing between load balancing algorithms">
      <circle className="orbit orbit-one" cx="380" cy="112" r="73" />
      <circle className="orbit orbit-two" cx="380" cy="112" r="97" />
      <path className="decision-line line-one" d="M380 112L190 53M380 112L570 53M380 112L190 171M380 112L570 171" />
      <circle className="decision-pulse pulse-one" cx="380" cy="112" r="4" />
      <circle className="decision-pulse pulse-two" cx="380" cy="112" r="4" />
      <g className="svg-algorithm" transform="translate(120 27)"><rect width="140" height="52" rx="2" /><text x="70" y="31">ROUND ROBIN</text></g>
      <g className="svg-algorithm selected-algorithm" transform="translate(500 27)"><rect width="160" height="52" rx="2" /><text x="80" y="31">LEAST LATENCY</text></g>
      <g className="svg-algorithm" transform="translate(120 145)"><rect width="140" height="52" rx="2" /><text x="70" y="31">EWMA</text></g>
      <g className="svg-algorithm" transform="translate(500 145)"><rect width="160" height="52" rx="2" /><text x="80" y="31">HASHING</text></g>
      <g className="som-core"><circle cx="380" cy="112" r="36" /><text x="380" y="108">SOM</text><text className="svg-node-sub" x="380" y="125">choose</text></g>
      <text className="svg-caption" x="380" y="222">ALGORITHM ORCHESTRATION / ADAPTIVE WEIGHTS</text>
    </svg>
  );
}

export function MemoryDiagram() {
  return (
    <svg className="animated-svg" viewBox="0 0 760 190" role="img" aria-label="A session outcome feeding back into the next policy decision">
      <path className="memory-track" d="M104 95C180 15 268 15 344 95S508 175 656 95" />
      <path className="memory-pulse-line" d="M104 95C180 15 268 15 344 95S508 175 656 95" />
      <circle className="memory-packet" cx="104" cy="95" r="5" />
      <g className="memory-node" transform="translate(40 64)"><circle cx="31" cy="31" r="31" /><text x="31" y="28">SESSION</text><text className="svg-node-sub" x="31" y="43">active</text></g>
      <g className="memory-node" transform="translate(212 20)"><circle cx="31" cy="31" r="31" /><text x="31" y="28">OUTCOME</text><text className="svg-node-sub" x="31" y="43">latency</text></g>
      <g className="memory-node memory-node-lime" transform="translate(358 102)"><circle cx="31" cy="31" r="31" /><text x="31" y="28">JOURNAL</text><text className="svg-node-sub" x="31" y="43">memory</text></g>
      <g className="memory-node" transform="translate(622 64)"><circle cx="31" cy="31" r="31" /><text x="31" y="28">POLICY</text><text className="svg-node-sub" x="31" y="43">next</text></g>
      <text className="svg-caption" x="380" y="179">SESSION OUTCOME / FEEDBACK LOOP</text>
    </svg>
  );
}
