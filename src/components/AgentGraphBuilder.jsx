import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Workflow, Plus, Trash2, Play, RotateCcw, ZoomIn, ZoomOut,
  Brain, Cpu, Shield, GitBranch, Database, Wrench, Eye,
  ChevronDown, Maximize2, Link2
} from 'lucide-react';

const NODE_TYPES = [
  { type: 'orchestrator', label: 'Orchestrator', icon: Brain, color: '#818cf8', desc: 'Routes tasks to workers' },
  { type: 'worker', label: 'Worker Agent', icon: Cpu, color: '#22d3ee', desc: 'Executes specific tasks' },
  { type: 'critic', label: 'Critic Agent', icon: Shield, color: '#fb7185', desc: 'Evaluates outputs' },
  { type: 'router', label: 'Router', icon: GitBranch, color: '#fbbf24', desc: 'Conditional routing' },
  { type: 'memory', label: 'Memory Store', icon: Database, color: '#a78bfa', desc: 'Shared memory' },
  { type: 'tool', label: 'Tool Server', icon: Wrench, color: '#34d399', desc: 'External tools/APIs' },
];

const PRESET_GRAPHS = {
  empty: { name: 'Blank Canvas', nodes: [], connections: [] },
  simple: {
    name: 'Simple Chain',
    nodes: [
      { id: 'n1', type: 'orchestrator', x: 100, y: 200, label: 'Coordinator' },
      { id: 'n2', type: 'worker', x: 400, y: 120, label: 'Researcher' },
      { id: 'n3', type: 'worker', x: 400, y: 280, label: 'Writer' },
      { id: 'n4', type: 'critic', x: 700, y: 200, label: 'Reviewer' },
    ],
    connections: [
      { from: 'n1', to: 'n2' }, { from: 'n1', to: 'n3' },
      { from: 'n2', to: 'n4' }, { from: 'n3', to: 'n4' },
    ],
  },
  complex: {
    name: 'Full Pipeline',
    nodes: [
      { id: 'n1', type: 'router', x: 80, y: 220, label: 'Router' },
      { id: 'n2', type: 'orchestrator', x: 300, y: 100, label: 'Planner' },
      { id: 'n3', type: 'worker', x: 520, y: 60, label: 'Coder' },
      { id: 'n4', type: 'worker', x: 520, y: 180, label: 'Tester' },
      { id: 'n5', type: 'memory', x: 300, y: 340, label: 'Context DB' },
      { id: 'n6', type: 'tool', x: 520, y: 340, label: 'MCP Tools' },
      { id: 'n7', type: 'critic', x: 740, y: 140, label: 'QA Agent' },
      { id: 'n8', type: 'orchestrator', x: 740, y: 300, label: 'Deployer' },
    ],
    connections: [
      { from: 'n1', to: 'n2' }, { from: 'n1', to: 'n5' },
      { from: 'n2', to: 'n3' }, { from: 'n2', to: 'n4' },
      { from: 'n3', to: 'n7' }, { from: 'n4', to: 'n7' },
      { from: 'n5', to: 'n6' }, { from: 'n6', to: 'n8' },
      { from: 'n7', to: 'n8' },
    ],
  },
};

let nodeIdCounter = 100;

export default function AgentGraphBuilder() {
  const [nodes, setNodes] = useState(PRESET_GRAPHS.complex.nodes);
  const [connections, setConnections] = useState(PRESET_GRAPHS.complex.connections);
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggingNode, setDraggingNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectMode, setConnectMode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [animatingConnections, setAnimatingConnections] = useState(new Set());
  const [isSimulating, setIsSimulating] = useState(false);
  const canvasRef = useRef(null);

  // Simulate data flow animation
  useEffect(() => {
    if (!isSimulating) {
      setAnimatingConnections(new Set());
      return;
    }
    let idx = 0;
    const interval = setInterval(() => {
      const connIdx = idx % connections.length;
      setAnimatingConnections(new Set([connIdx]));
      idx++;
    }, 800);
    return () => clearInterval(interval);
  }, [isSimulating, connections.length]);

  const addNode = (type) => {
    const typeInfo = NODE_TYPES.find(t => t.type === type);
    const id = `n${++nodeIdCounter}`;
    setNodes(prev => [...prev, {
      id, type,
      x: 200 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      label: typeInfo.label,
    }]);
    setShowNodePalette(false);
  };

  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNode === nodeId) setSelectedNode(null);
  };

  const handleMouseDown = (e, nodeId) => {
    if (connectMode) {
      if (connectMode !== nodeId) {
        const exists = connections.some(c =>
          (c.from === connectMode && c.to === nodeId) ||
          (c.from === nodeId && c.to === connectMode)
        );
        if (!exists) {
          setConnections(prev => [...prev, { from: connectMode, to: nodeId }]);
        }
      }
      setConnectMode(null);
      return;
    }
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    setDraggingNode(nodeId);
    setSelectedNode(nodeId);
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - node.x,
      y: (e.clientY - rect.top) / zoom - node.y,
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!draggingNode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom - dragOffset.x;
    const y = (e.clientY - rect.top) / zoom - dragOffset.y;
    setNodes(prev => prev.map(n => n.id === draggingNode ? { ...n, x, y } : n));
  }, [draggingNode, dragOffset, zoom]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const getNodeCenter = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + 70, y: node.y + 30 };
  };

  const loadPreset = (key) => {
    const preset = PRESET_GRAPHS[key];
    setNodes([...preset.nodes]);
    setConnections([...preset.connections]);
    setSelectedNode(null);
    setConnectMode(null);
  };

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const selectedTypeInfo = selectedNodeData ? NODE_TYPES.find(t => t.type === selectedNodeData.type) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
              <Workflow size={22} />
            </div>
            Agent Graph Builder
          </h2>
          <p>Design multi-agent architectures with drag-and-drop nodes and connections</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => loadPreset('simple')}>
            Simple Chain
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => loadPreset('complex')}>
            Full Pipeline
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => loadPreset('empty')}>
            <RotateCcw size={14} /> Clear
          </button>
          <button
            className={`btn btn-sm ${isSimulating ? 'btn-danger' : 'btn-success'}`}
            onClick={() => setIsSimulating(!isSimulating)}
          >
            <Play size={14} /> {isSimulating ? 'Stop Flow' : 'Simulate Flow'}
          </button>
        </div>
      </div>

      <div className="grid-sidebar">
        {/* Canvas */}
        <div
          ref={canvasRef}
          className="graph-canvas"
          style={{ position: 'relative' }}
          onClick={() => { setSelectedNode(null); setConnectMode(null); }}
        >
          <div className="grid-pattern" />

          {/* Toolbar */}
          <div style={{
            position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 20,
            display: 'flex', gap: '0.25rem'
          }}>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setShowNodePalette(!showNodePalette)}>
              <Plus size={16} />
            </button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>
              <ZoomIn size={16} />
            </button>
            <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
              <ZoomOut size={16} />
            </button>
            <button
              className={`btn btn-sm ${connectMode ? 'btn-primary' : 'btn-secondary'}`}
              onClick={(e) => { e.stopPropagation(); setConnectMode(connectMode ? null : '__WAITING__'); }}
              style={{ paddingInline: '0.6rem' }}
            >
              <Link2 size={14} /> {connectMode ? 'Click nodes...' : 'Connect'}
            </button>
          </div>

          {/* Node Palette Dropdown */}
          {showNodePalette && (
            <div style={{
              position: 'absolute', top: '3rem', left: '0.75rem', zIndex: 30,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)', padding: '0.5rem', width: '200px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              {NODE_TYPES.map(nt => {
                const Icon = nt.icon;
                return (
                  <button
                    key={nt.type}
                    onClick={(e) => { e.stopPropagation(); addNode(nt.type); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      width: '100%', padding: '0.5rem 0.6rem', border: 'none',
                      borderRadius: 'var(--radius-sm)', background: 'transparent',
                      color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem',
                      fontFamily: 'var(--font-sans)', textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.target.style.background = 'var(--bg-glass-hover)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: `${nt.color}20`, color: nt.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{nt.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{nt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* SVG Connections */}
          <svg
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1,
              pointerEvents: 'none', transform: `scale(${zoom})`, transformOrigin: '0 0'
            }}
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(129,140,248,0.5)" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee" />
              </marker>
            </defs>
            {connections.map((conn, i) => {
              const from = getNodeCenter(conn.from);
              const to = getNodeCenter(conn.to);
              const isActive = animatingConnections.has(i);
              const midX = (from.x + to.x) / 2;
              return (
                <g key={i}>
                  <path
                    d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                    className={`connection-line ${isActive ? 'active' : ''}`}
                    markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    style={isActive ? { stroke: '#22d3ee', strokeWidth: 3 } : {}}
                  />
                  {isActive && (
                    <circle r="4" className="data-particle">
                      <animateMotion
                        dur="0.8s"
                        repeatCount="1"
                        path={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', inset: 0, zIndex: 2 }}>
            {nodes.map(node => {
              const typeInfo = NODE_TYPES.find(t => t.type === node.type);
              const Icon = typeInfo.icon;
              return (
                <div
                  key={node.id}
                  className={`agent-node ${selectedNode === node.id ? 'active' : ''}`}
                  style={{ left: node.x, top: node.y }}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connectMode && connectMode !== '__WAITING__') {
                      // handled in handleMouseDown
                    } else if (connectMode === '__WAITING__') {
                      setConnectMode(node.id);
                    } else {
                      setSelectedNode(node.id);
                    }
                  }}
                >
                  <div className="node-header">
                    <div className="node-icon" style={{
                      background: `${typeInfo.color}20`, color: typeInfo.color
                    }}>
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="node-title">{node.label}</div>
                      <div className="node-type">{typeInfo.label}</div>
                    </div>
                  </div>
                  {isSimulating && (
                    <div style={{
                      marginTop: '0.3rem', fontSize: '0.65rem', color: 'var(--accent-emerald)',
                      display: 'flex', alignItems: 'center', gap: '0.3rem'
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--accent-emerald)',
                        animation: 'pulse-dot 1s ease-in-out infinite'
                      }} />
                      Active
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stats Overlay */}
          <div style={{
            position: 'absolute', bottom: '0.75rem', left: '0.75rem', zIndex: 20,
            display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)'
          }}>
            <span>{nodes.length} nodes</span>
            <span>{connections.length} connections</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Properties Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto' }}>
          {/* Selected Node Properties */}
          <div className="glow-card">
            <div className="card-header">
              <h3><Eye size={16} /> Node Properties</h3>
            </div>
            <div className="card-body">
              {selectedNodeData ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${selectedTypeInfo.color}20`, color: selectedTypeInfo.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {React.createElement(selectedTypeInfo.icon, { size: 20 })}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{selectedNodeData.label}</div>
                      <span className="badge badge-indigo">{selectedTypeInfo.label}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Node Label
                    </label>
                    <input
                      className="input"
                      value={selectedNodeData.label}
                      onChange={e => setNodes(prev => prev.map(n => n.id === selectedNode ? { ...n, label: e.target.value } : n))}
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      System Prompt
                    </label>
                    <textarea
                      className="input"
                      rows={3}
                      placeholder="Define agent behavior..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                      Model
                    </label>
                    <select className="select" style={{ width: '100%' }}>
                      <option>gemini-2.5-pro</option>
                      <option>gemini-2.5-flash</option>
                      <option>claude-opus-4</option>
                      <option>gpt-4.1</option>
                    </select>
                  </div>
                  <div className="flex gap-sm" style={{ marginTop: '1rem' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                      onClick={() => setConnectMode(selectedNode)}
                    >
                      <Link2 size={14} /> Connect
                    </button>
                    <button className="btn btn-danger btn-sm"
                      onClick={() => deleteNode(selectedNode)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-icon">
                    <Eye size={24} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>No Node Selected</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Click a node to edit its properties
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection List */}
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3><Link2 size={16} /> Connections</h3>
              <span className="badge badge-cyan">{connections.length}</span>
            </div>
            <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {connections.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No connections yet
                </div>
              ) : (
                connections.map((conn, i) => {
                  const fromNode = nodes.find(n => n.id === conn.from);
                  const toNode = nodes.find(n => n.id === conn.to);
                  if (!fromNode || !toNode) return null;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                      background: animatingConnections.has(i) ? 'rgba(34,211,238,0.08)' : 'transparent',
                      marginBottom: '0.25rem', fontSize: '0.78rem', transition: 'background 0.3s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{fromNode.label}</span>
                        <span style={{ color: 'var(--text-muted)' }}>→</span>
                        <span style={{ fontWeight: 600 }}>{toNode.label}</span>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConnections(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ padding: '0.2rem' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
