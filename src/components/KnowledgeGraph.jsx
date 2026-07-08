import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Network, Search, Filter, ZoomIn, ZoomOut, Maximize2,
  Plus, Trash2, Link, Tag, Eye, EyeOff, Info,
  ChevronRight, Layers, Sparkles, Database
} from 'lucide-react';

const ENTITY_TYPES = {
  agent: { color: '#818cf8', label: 'Agent', shape: 'circle' },
  tool: { color: '#22d3ee', label: 'Tool', shape: 'diamond' },
  knowledge: { color: '#34d399', label: 'Knowledge', shape: 'square' },
  memory: { color: '#e879f9', label: 'Memory', shape: 'circle' },
  action: { color: '#fbbf24', label: 'Action', shape: 'hexagon' },
  concept: { color: '#fb7185', label: 'Concept', shape: 'circle' },
};

const RELATION_TYPES = {
  uses: { color: '#818cf8', label: 'uses', style: 'solid' },
  knows: { color: '#34d399', label: 'knows', style: 'dashed' },
  produces: { color: '#fbbf24', label: 'produces', style: 'solid' },
  requires: { color: '#fb7185', label: 'requires', style: 'dotted' },
  delegates_to: { color: '#e879f9', label: 'delegates to', style: 'solid' },
  stores_in: { color: '#22d3ee', label: 'stores in', style: 'dashed' },
};

const INITIAL_ENTITIES = [
  { id: 'e1', type: 'agent', label: 'Planner Agent', x: 400, y: 200, description: 'Decomposes tasks into sub-goals and delegates to workers.', properties: { model: 'gemini-2.5-pro', role: 'orchestrator', tokens: '48K' } },
  { id: 'e2', type: 'agent', label: 'Coder Agent', x: 650, y: 120, description: 'Writes production-quality code from specifications.', properties: { model: 'claude-opus-4', role: 'worker', tokens: '124K' } },
  { id: 'e3', type: 'agent', label: 'Researcher Agent', x: 650, y: 300, description: 'Gathers information from external sources.', properties: { model: 'gemini-2.5-flash', role: 'worker', tokens: '28K' } },
  { id: 'e4', type: 'agent', label: 'Reviewer Agent', x: 400, y: 400, description: 'Reviews code quality and provides feedback.', properties: { model: 'gemini-2.5-pro', role: 'critic', tokens: '62K' } },
  { id: 'e5', type: 'tool', label: 'Code Search', x: 870, y: 80, description: 'Searches codebase for patterns and references.', properties: { api: 'grep_search', latency: '45ms' } },
  { id: 'e6', type: 'tool', label: 'File Editor', x: 870, y: 180, description: 'Reads and writes files to the filesystem.', properties: { api: 'write_file', latency: '120ms' } },
  { id: 'e7', type: 'tool', label: 'Web Search', x: 870, y: 340, description: 'Searches the web for information.', properties: { api: 'search_web', latency: '800ms' } },
  { id: 'e8', type: 'knowledge', label: 'API Docs', x: 180, y: 120, description: 'REST API documentation and schemas.', properties: { format: 'OpenAPI 3.0', entries: '847' } },
  { id: 'e9', type: 'knowledge', label: 'Code Patterns', x: 180, y: 260, description: 'Established code patterns and conventions.', properties: { format: 'Markdown', entries: '156' } },
  { id: 'e10', type: 'memory', label: 'Session Memory', x: 180, y: 400, description: 'Short-term memory for current task context.', properties: { type: 'ephemeral', capacity: '128K tokens' } },
  { id: 'e11', type: 'memory', label: 'Long-term Store', x: 400, y: 520, description: 'Persistent vector database for learned patterns.', properties: { type: 'persistent', backend: 'Vertex AI Vector Search' } },
  { id: 'e12', type: 'action', label: 'Write Code', x: 650, y: 460, description: 'Generate and write source code files.', properties: { output: 'source files', avg_tokens: '2.4K' } },
  { id: 'e13', type: 'concept', label: 'Task Planning', x: 250, y: 50, description: 'The process of breaking work into subtasks.', properties: { methodology: 'ReAct', depth: '3 levels' } },
];

const INITIAL_RELATIONS = [
  { from: 'e1', to: 'e2', type: 'delegates_to' },
  { from: 'e1', to: 'e3', type: 'delegates_to' },
  { from: 'e1', to: 'e4', type: 'delegates_to' },
  { from: 'e2', to: 'e5', type: 'uses' },
  { from: 'e2', to: 'e6', type: 'uses' },
  { from: 'e3', to: 'e7', type: 'uses' },
  { from: 'e1', to: 'e8', type: 'knows' },
  { from: 'e2', to: 'e9', type: 'knows' },
  { from: 'e1', to: 'e10', type: 'stores_in' },
  { from: 'e4', to: 'e11', type: 'stores_in' },
  { from: 'e2', to: 'e12', type: 'produces' },
  { from: 'e1', to: 'e13', type: 'knows' },
  { from: 'e12', to: 'e4', type: 'requires' },
  { from: 'e3', to: 'e10', type: 'stores_in' },
];

export default function KnowledgeGraph() {
  const [entities, setEntities] = useState(INITIAL_ENTITIES);
  const [relations] = useState(INITIAL_RELATIONS);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleTypes, setVisibleTypes] = useState(new Set(Object.keys(ENTITY_TYPES)));
  const [dragging, setDragging] = useState(null);
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);

  const filteredEntities = entities.filter(e =>
    visibleTypes.has(e.type) &&
    (searchQuery === '' || e.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRelations = relations.filter(r =>
    filteredEntities.some(e => e.id === r.from) && filteredEntities.some(e => e.id === r.to)
  );

  const handleMouseDown = useCallback((e, entityId) => {
    e.stopPropagation();
    setDragging(entityId);
    setSelectedEntity(entityId);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setEntities(prev => prev.map(ent =>
      ent.id === dragging ? { ...ent, x, y } : ent
    ));
  }, [dragging, zoom]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const toggleType = (type) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const getConnectedEntities = (entityId) => {
    const connected = new Set();
    relations.forEach(r => {
      if (r.from === entityId) connected.add(r.to);
      if (r.to === entityId) connected.add(r.from);
    });
    return connected;
  };

  const selectedEntityData = entities.find(e => e.id === selectedEntity);
  const connectedIds = selectedEntity ? getConnectedEntities(selectedEntity) : new Set();

  const renderShape = (entity, isSelected, isConnected, isHovered) => {
    const config = ENTITY_TYPES[entity.type];
    const size = isSelected ? 28 : isConnected ? 24 : 20;
    const opacity = selectedEntity && !isSelected && !isConnected ? 0.3 : 1;

    return (
      <g
        key={entity.id}
        transform={`translate(${entity.x}, ${entity.y})`}
        onMouseDown={(e) => handleMouseDown(e, entity.id)}
        onMouseEnter={() => setHoveredEntity(entity.id)}
        onMouseLeave={() => setHoveredEntity(null)}
        style={{ cursor: 'grab', opacity, transition: 'opacity 0.2s' }}
      >
        {/* Glow effect */}
        {(isSelected || isHovered) && (
          <circle r={size + 12} fill={config.color} opacity={0.15}>
            <animate attributeName="r" values={`${size + 10};${size + 16};${size + 10}`} dur="2s" repeatCount="indefinite" />
          </circle>
        )}

        {/* Shape */}
        <circle
          r={size}
          fill={`${config.color}30`}
          stroke={config.color}
          strokeWidth={isSelected ? 3 : 1.5}
        />

        {/* Inner dot */}
        <circle r={6} fill={config.color} />

        {/* Label */}
        <text
          y={size + 16}
          textAnchor="middle"
          fill={isSelected ? '#f0f0f5' : '#a0a0b8'}
          fontSize={11}
          fontWeight={isSelected ? 700 : 500}
          fontFamily="Inter, sans-serif"
        >
          {entity.label}
        </text>

        {/* Type badge */}
        <text
          y={size + 30}
          textAnchor="middle"
          fill={config.color}
          fontSize={8}
          fontFamily="Inter, sans-serif"
          opacity={0.7}
        >
          {config.label}
        </text>
      </g>
    );
  };

  const renderRelation = (rel) => {
    const from = filteredEntities.find(e => e.id === rel.from);
    const to = filteredEntities.find(e => e.id === rel.to);
    if (!from || !to) return null;

    const config = RELATION_TYPES[rel.type];
    const isHighlighted = selectedEntity && (rel.from === selectedEntity || rel.to === selectedEntity);
    const opacity = selectedEntity ? (isHighlighted ? 1 : 0.1) : 0.4;

    // Calculate arrow midpoint for label
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;

    // Slight curve
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cx = midX - dy * 0.1;
    const cy = midY + dx * 0.1;

    return (
      <g key={`${rel.from}-${rel.to}`} style={{ transition: 'opacity 0.2s' }} opacity={opacity}>
        <path
          d={`M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`}
          fill="none"
          stroke={config.color}
          strokeWidth={isHighlighted ? 2 : 1}
          strokeDasharray={config.style === 'dashed' ? '6,4' : config.style === 'dotted' ? '2,4' : 'none'}
          markerEnd="url(#arrowhead)"
        />
        {isHighlighted && (
          <text x={cx} y={cy - 6} textAnchor="middle" fill={config.color} fontSize={9} fontFamily="Inter, sans-serif">
            {config.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
              <Network size={22} />
            </div>
            Knowledge Graph
          </h2>
          <p>Explore entity relationships, agent knowledge, and system topology</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
            <ZoomOut size={14} />
          </button>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '35px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
            <ZoomIn size={14} />
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setZoom(1); setSelectedEntity(null); }}>
            <Maximize2 size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}><Database size={18} /></div>
          <div className="stat-value">{entities.length}</div>
          <div className="stat-label">Entities</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}><Link size={18} /></div>
          <div className="stat-value">{relations.length}</div>
          <div className="stat-label">Relations</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}><Layers size={18} /></div>
          <div className="stat-value">{Object.keys(ENTITY_TYPES).length}</div>
          <div className="stat-label">Entity Types</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232,121,249,0.15)', color: '#e879f9' }}><Sparkles size={18} /></div>
          <div className="stat-value">{Object.keys(RELATION_TYPES).length}</div>
          <div className="stat-label">Relation Types</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', height: 'calc(100vh - 280px)' }}>
        {/* Graph Canvas */}
        <div className="glow-card" style={{ overflow: 'hidden', position: 'relative' }}>
          <div className="card-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, background: 'rgba(22,22,35,0.9)', backdropFilter: 'blur(8px)' }}>
            <h3><Network size={16} /> Entity Graph</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search entities..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', padding: '0.35rem 0.5rem 0.35rem 1.8rem',
                    color: 'var(--text-primary)', fontSize: '0.75rem', outline: 'none', width: '180px',
                    fontFamily: 'var(--font-sans)'
                  }}
                />
              </div>
            </div>
          </div>

          <svg
            ref={canvasRef}
            width="100%"
            height="100%"
            style={{ background: '#0a0a0f', cursor: dragging ? 'grabbing' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedEntity(null)}
          >
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="28" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#6b6b80" />
              </marker>
              {/* Grid pattern */}
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="0.5" fill="rgba(255,255,255,0.05)" />
              </pattern>
            </defs>

            <g transform={`scale(${zoom})`}>
              <rect width="2000" height="2000" fill="url(#grid)" />

              {/* Relations */}
              {filteredRelations.map(renderRelation)}

              {/* Entities */}
              {filteredEntities.map(entity => {
                const isSelected = entity.id === selectedEntity;
                const isConnected = connectedIds.has(entity.id);
                const isHovered = entity.id === hoveredEntity;
                return renderShape(entity, isSelected, isConnected, isHovered);
              })}
            </g>
          </svg>
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto' }}>
          {/* Type Filter */}
          <div className="glow-card">
            <div className="card-header">
              <h3><Filter size={16} /> Entity Types</h3>
            </div>
            <div className="card-body">
              {Object.entries(ENTITY_TYPES).map(([key, config]) => {
                const count = entities.filter(e => e.type === key).length;
                const visible = visibleTypes.has(key);
                return (
                  <div
                    key={key}
                    onClick={() => toggleType(key)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', opacity: visible ? 1 : 0.4,
                      transition: 'all 0.15s', marginBottom: '0.2rem'
                    }}
                  >
                    <div style={{
                      width: 12, height: 12, borderRadius: 3,
                      background: config.color, flexShrink: 0
                    }} />
                    <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 500 }}>
                      {config.label}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{count}</span>
                    {visible ? <Eye size={13} color="var(--text-muted)" /> : <EyeOff size={13} color="var(--text-muted)" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Entity Inspector */}
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3><Info size={16} /> Entity Inspector</h3>
            </div>
            <div className="card-body">
              {selectedEntityData ? (() => {
                const config = ENTITY_TYPES[selectedEntityData.type];
                const entityRelations = relations.filter(r => r.from === selectedEntity || r.to === selectedEntity);
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${config.color}20`, color: config.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', fontWeight: 800
                      }}>
                        {selectedEntityData.label[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedEntityData.label}</div>
                        <span className="badge" style={{ background: `${config.color}20`, color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                      {selectedEntityData.description}
                    </div>

                    {/* Properties */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 600 }}>
                      Properties
                    </div>
                    {Object.entries(selectedEntityData.properties).map(([key, value]) => (
                      <div key={key} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '0.3rem 0.5rem', marginBottom: '0.2rem',
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                        fontSize: '0.72rem'
                      }}>
                        <span style={{ color: 'var(--text-muted)' }}>{key}</span>
                        <span style={{ color: config.color, fontFamily: 'var(--font-mono)' }}>{value}</span>
                      </div>
                    ))}

                    {/* Relations */}
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', marginTop: '0.75rem', fontWeight: 600 }}>
                      Relations ({entityRelations.length})
                    </div>
                    {entityRelations.map((rel, i) => {
                      const relConfig = RELATION_TYPES[rel.type];
                      const isOutgoing = rel.from === selectedEntity;
                      const targetId = isOutgoing ? rel.to : rel.from;
                      const target = entities.find(e => e.id === targetId);
                      if (!target) return null;
                      return (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.3rem 0.5rem', marginBottom: '0.15rem',
                          background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                          fontSize: '0.72rem', cursor: 'pointer'
                        }} onClick={() => setSelectedEntity(targetId)}>
                          <ChevronRight size={10} color={isOutgoing ? relConfig.color : 'var(--text-muted)'} style={{ transform: isOutgoing ? 'none' : 'rotate(180deg)' }} />
                          <span style={{ color: relConfig.color }}>{relConfig.label}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{target.label}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })() : (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <div className="empty-icon"><Network size={24} color="var(--text-muted)" /></div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Select an Entity</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Click any node in the graph to inspect
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
