import React, { useState, useEffect } from 'react';
import {
  BrainCircuit, Search, Trash2, RefreshCw, Clock,
  Database, Layers, Sparkles, Filter, ChevronRight, Zap
} from 'lucide-react';

const MEMORY_TYPES = [
  { id: 'short_term', label: 'Short-Term', icon: Clock, color: '#22d3ee', capacity: 8192, used: 5847 },
  { id: 'long_term', label: 'Long-Term', icon: Database, color: '#818cf8', capacity: 128000, used: 42300 },
  { id: 'episodic', label: 'Episodic', icon: Layers, color: '#34d399', capacity: 64000, used: 18720 },
  { id: 'semantic', label: 'Semantic', icon: Sparkles, color: '#e879f9', capacity: 256000, used: 89000 },
];

const MEMORY_ENTRIES = {
  short_term: [
    { id: 1, key: 'current_task', value: 'Building REST API with authentication using JWT RS256', tokens: 42, age: '2s ago', relevance: 0.98, type: 'task' },
    { id: 2, key: 'user_preference', value: 'User prefers TypeScript over JavaScript for backend code', tokens: 28, age: '15s ago', relevance: 0.85, type: 'preference' },
    { id: 3, key: 'last_tool_result', value: '{ status: 200, files_created: ["auth.js", "routes.js"], tests_passed: 12/12 }', tokens: 86, age: '30s ago', relevance: 0.92, type: 'result' },
    { id: 4, key: 'active_agents', value: '["Planner", "Coder", "Reviewer"] - 3 agents in pipeline', tokens: 35, age: '1m ago', relevance: 0.77, type: 'state' },
    { id: 5, key: 'error_context', value: 'Previous attempt failed: missing CORS middleware configuration in Express app', tokens: 52, age: '2m ago', relevance: 0.65, type: 'error' },
    { id: 6, key: 'conversation_turn', value: 'Turn 7: User requested adding rate limiting to login endpoint', tokens: 38, age: '3m ago', relevance: 0.71, type: 'conversation' },
  ],
  long_term: [
    { id: 7, key: 'project_architecture', value: 'Monorepo with packages: api, shared, client. Using pnpm workspaces.', tokens: 120, age: '2h ago', relevance: 0.88, type: 'architecture' },
    { id: 8, key: 'coding_standards', value: 'ESLint + Prettier, conventional commits, 80% test coverage minimum', tokens: 95, age: '1d ago', relevance: 0.82, type: 'standards' },
    { id: 9, key: 'deployment_config', value: 'GCP Cloud Run, Cloud SQL PostgreSQL, Redis for sessions', tokens: 78, age: '3d ago', relevance: 0.70, type: 'config' },
    { id: 10, key: 'team_decisions', value: 'Decision: Use Passport.js v2 for auth (voted 3/4 agents)', tokens: 65, age: '1w ago', relevance: 0.60, type: 'decision' },
  ],
  episodic: [
    { id: 11, key: 'episode_001', value: 'Successfully debugged CORS issue by adding origin whitelist. Root cause: missing middleware order.', tokens: 210, age: '1h ago', relevance: 0.90, type: 'success' },
    { id: 12, key: 'episode_002', value: 'Failed attempt at implementing OAuth2 with Google - token refresh was broken. Switched to JWT.', tokens: 340, age: '3h ago', relevance: 0.75, type: 'failure' },
    { id: 13, key: 'episode_003', value: 'Database migration went smoothly after adding proper rollback hooks.', tokens: 180, age: '6h ago', relevance: 0.65, type: 'success' },
  ],
  semantic: [
    { id: 14, key: 'jwt_knowledge', value: 'JWT RS256 uses asymmetric keys. Public key verifies, private key signs. Recommended for microservices.', tokens: 450, age: 'base', relevance: 0.95, type: 'knowledge' },
    { id: 15, key: 'express_patterns', value: 'Express middleware execution order: cors → helmet → rateLimit → auth → routes → errorHandler', tokens: 280, age: 'base', relevance: 0.88, type: 'knowledge' },
    { id: 16, key: 'security_best_practices', value: 'Always: hash passwords with bcrypt (12+ rounds), use httpOnly cookies, implement CSRF protection', tokens: 320, age: 'base', relevance: 0.92, type: 'knowledge' },
    { id: 17, key: 'testing_patterns', value: 'Test pyramid: 70% unit, 20% integration, 10% E2E. Use supertest for API testing with Jest.', tokens: 260, age: 'base', relevance: 0.80, type: 'knowledge' },
  ],
};

const TYPE_COLORS = {
  task: '#818cf8', preference: '#22d3ee', result: '#34d399', state: '#fbbf24',
  error: '#fb7185', conversation: '#a78bfa', architecture: '#60a5fa', standards: '#818cf8',
  config: '#22d3ee', decision: '#fbbf24', success: '#34d399', failure: '#fb7185',
  knowledge: '#e879f9',
};

export default function MemoryInspector() {
  const [activeType, setActiveType] = useState('short_term');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [decayEnabled, setDecayEnabled] = useState(true);
  const [entries, setEntries] = useState(MEMORY_ENTRIES);

  const memType = MEMORY_TYPES.find(t => t.id === activeType);
  const currentEntries = entries[activeType] || [];
  const filtered = currentEntries.filter(e =>
    e.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTokens = currentEntries.reduce((s, e) => s + e.tokens, 0);

  const deleteEntry = (id) => {
    setEntries(prev => ({
      ...prev,
      [activeType]: prev[activeType].filter(e => e.id !== id)
    }));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
              <BrainCircuit size={22} />
            </div>
            Agent Memory Inspector
          </h2>
          <p>Explore and manage agent memory systems — short-term, long-term, episodic, and semantic</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="toggle-container" onClick={() => setDecayEnabled(!decayEnabled)}>
            <div className={`toggle-track ${decayEnabled ? 'active' : ''}`}>
              <div className="toggle-thumb" />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Memory Decay</span>
          </div>
        </div>
      </div>

      {/* Memory Type Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {MEMORY_TYPES.map(type => {
          const Icon = type.icon;
          const pct = Math.round((type.used / type.capacity) * 100);
          const isActive = activeType === type.id;
          return (
            <div
              key={type.id}
              className="stat-card"
              style={{
                cursor: 'pointer',
                borderColor: isActive ? type.color : 'var(--border-color)',
                boxShadow: isActive ? `0 0 20px ${type.color}20` : 'none'
              }}
              onClick={() => setActiveType(type.id)}
            >
              <div className="stat-icon" style={{ background: `${type.color}20`, color: type.color }}>
                <Icon size={18} />
              </div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{type.label}</div>
              <div className="stat-label">{type.used.toLocaleString()} / {type.capacity.toLocaleString()} tokens</div>
              <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: pct > 80 ? 'var(--accent-rose)' : type.color,
                  }}
                />
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {pct}% utilized · {(entries[type.id] || []).length} entries
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-sidebar">
        {/* Memory Entries List */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h3>
              {React.createElement(memType.icon, { size: 16, color: memType.color })}
              {memType.label} Memory
            </h3>
            <span className="badge" style={{ background: `${memType.color}20`, color: memType.color }}>
              {filtered.length} entries
            </span>
          </div>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute', left: '0.75rem', top: '50%',
                transform: 'translateY(-50%)', color: 'var(--text-muted)'
              }} />
              <input
                className="input"
                placeholder="Search memories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>
          <div className="card-body" style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {filtered.map(entry => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: selectedEntry?.id === entry.id ? `${memType.color}10` : 'transparent',
                  border: selectedEntry?.id === entry.id ? `1px solid ${memType.color}30` : '1px solid transparent',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code style={{
                      fontSize: '0.75rem', fontFamily: 'var(--font-mono)',
                      color: memType.color, fontWeight: 600
                    }}>
                      {entry.key}
                    </code>
                    <span className="badge" style={{
                      background: `${TYPE_COLORS[entry.type]}15`,
                      color: TYPE_COLORS[entry.type],
                      fontSize: '0.6rem'
                    }}>
                      {entry.type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{entry.age}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                      style={{ padding: '0.15rem' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {entry.value}
                </div>
                <div style={{
                  display: 'flex', gap: '1rem', marginTop: '0.4rem',
                  fontSize: '0.65rem', color: 'var(--text-muted)'
                }}>
                  <span>{entry.tokens} tokens</span>
                  <span>Relevance: {Math.round(entry.relevance * 100)}%</span>
                </div>
                {/* Relevance bar */}
                <div className="progress-bar" style={{ marginTop: '0.3rem', height: '3px' }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${entry.relevance * 100}%`,
                      background: entry.relevance > 0.8 ? 'var(--accent-emerald)' :
                        entry.relevance > 0.5 ? 'var(--accent-amber)' : 'var(--accent-rose)',
                      opacity: decayEnabled ? entry.relevance : 1,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto' }}>
          <div className="glow-card">
            <div className="card-header">
              <h3>🔍 Entry Detail</h3>
            </div>
            <div className="card-body">
              {selectedEntry ? (
                <div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Key</label>
                    <code style={{
                      fontSize: '0.85rem', fontFamily: 'var(--font-mono)',
                      color: memType.color, fontWeight: 600
                    }}>
                      {selectedEntry.key}
                    </code>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Value</label>
                    <div className="code-block">
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {selectedEntry.value}
                      </pre>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '0.6rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: memType.color }}>{selectedEntry.tokens}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tokens</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '0.6rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: selectedEntry.relevance > 0.8 ? '#34d399' : '#fbbf24' }}>
                        {Math.round(selectedEntry.relevance * 100)}%
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Relevance</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '0.6rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedEntry.age}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Created</div>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '0.6rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        <span className="badge" style={{ background: `${TYPE_COLORS[selectedEntry.type]}15`, color: TYPE_COLORS[selectedEntry.type] }}>
                          {selectedEntry.type}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Type</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-icon"><Search size={24} color="var(--text-muted)" /></div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Select a Memory Entry</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Click an entry to view details
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Token Distribution */}
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3><Zap size={16} /> Token Distribution</h3>
            </div>
            <div className="card-body">
              {currentEntries.map(entry => {
                const pct = (entry.tokens / totalTokens) * 100;
                return (
                  <div key={entry.id} style={{ marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{entry.key}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{entry.tokens}t ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="progress-bar" style={{ height: '4px' }}>
                      <div className="progress-fill" style={{ width: `${pct}%`, background: TYPE_COLORS[entry.type] || memType.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
