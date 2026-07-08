import React, { useState, useRef, useEffect } from 'react';
import {
  Clock, Play, Pause, SkipForward, Calendar, Filter,
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  XCircle, Timer, Zap, Users, Loader2
} from 'lucide-react';

const AGENTS = [
  { id: 'a1', name: 'Planner Alpha', color: '#818cf8', model: 'gemini-2.5-pro' },
  { id: 'a2', name: 'Coder Beta', color: '#22d3ee', model: 'claude-opus-4' },
  { id: 'a3', name: 'Researcher Gamma', color: '#34d399', model: 'gemini-2.5-flash' },
  { id: 'a4', name: 'Reviewer Delta', color: '#fbbf24', model: 'gemini-2.5-pro' },
  { id: 'a5', name: 'Deployer Zeta', color: '#e879f9', model: 'gemini-2.5-flash' },
];

const TIMELINE_EVENTS = [
  // Planner
  { id: 't1', agentId: 'a1', label: 'Decompose task', start: 0, duration: 8, status: 'completed', tokens: 4800, tools: ['thinking'] },
  { id: 't2', agentId: 'a1', label: 'Assign subtasks', start: 8, duration: 4, status: 'completed', tokens: 2100, tools: ['delegation'] },
  { id: 't3', agentId: 'a1', label: 'Monitor progress', start: 22, duration: 12, status: 'completed', tokens: 3200, tools: ['observation'] },
  { id: 't4', agentId: 'a1', label: 'Final review', start: 48, duration: 6, status: 'running', tokens: 1800, tools: ['thinking'] },
  // Coder
  { id: 't5', agentId: 'a2', label: 'Setup project structure', start: 10, duration: 6, status: 'completed', tokens: 8400, tools: ['write_file', 'run_command'] },
  { id: 't6', agentId: 'a2', label: 'Implement auth module', start: 16, duration: 14, status: 'completed', tokens: 24600, tools: ['write_file', 'grep_search'] },
  { id: 't7', agentId: 'a2', label: 'Write API endpoints', start: 30, duration: 10, status: 'completed', tokens: 18200, tools: ['write_file', 'grep_search'] },
  { id: 't8', agentId: 'a2', label: 'Add unit tests', start: 40, duration: 8, status: 'completed', tokens: 12400, tools: ['write_file', 'run_command'] },
  { id: 't9', agentId: 'a2', label: 'Fix review comments', start: 50, duration: 6, status: 'pending', tokens: 0, tools: [] },
  // Researcher
  { id: 't10', agentId: 'a3', label: 'Research best practices', start: 10, duration: 8, status: 'completed', tokens: 6800, tools: ['search_web', 'read_url'] },
  { id: 't11', agentId: 'a3', label: 'Gather API documentation', start: 18, duration: 6, status: 'completed', tokens: 4200, tools: ['search_web', 'read_url'] },
  { id: 't12', agentId: 'a3', label: 'Security audit research', start: 34, duration: 8, status: 'completed', tokens: 5600, tools: ['search_web'] },
  // Reviewer
  { id: 't13', agentId: 'a4', label: 'Code review: auth', start: 32, duration: 6, status: 'completed', tokens: 8200, tools: ['grep_search', 'view_file'] },
  { id: 't14', agentId: 'a4', label: 'Code review: API', start: 42, duration: 6, status: 'completed', tokens: 6400, tools: ['grep_search', 'view_file'] },
  { id: 't15', agentId: 'a4', label: 'Security review', start: 48, duration: 8, status: 'running', tokens: 3200, tools: ['grep_search'] },
  // Deployer
  { id: 't16', agentId: 'a5', label: 'Prepare CI config', start: 24, duration: 4, status: 'completed', tokens: 2800, tools: ['write_file'] },
  { id: 't17', agentId: 'a5', label: 'Setup staging env', start: 44, duration: 4, status: 'completed', tokens: 3400, tools: ['run_command'] },
  { id: 't18', agentId: 'a5', label: 'Deploy to staging', start: 52, duration: 4, status: 'pending', tokens: 0, tools: [] },
  { id: 't19', agentId: 'a5', label: 'Deploy to prod', start: 58, duration: 4, status: 'pending', tokens: 0, tools: [] },
];

const STATUS_CONFIG = {
  completed: { color: '#34d399', bg: 'rgba(52,211,153,0.15)', icon: CheckCircle2, label: 'Completed' },
  running: { color: '#818cf8', bg: 'rgba(129,140,248,0.2)', icon: Loader2, label: 'Running' },
  pending: { color: '#6b6b80', bg: 'rgba(107,107,128,0.1)', icon: Clock, label: 'Pending' },
  failed: { color: '#fb7185', bg: 'rgba(251,113,133,0.15)', icon: XCircle, label: 'Failed' },
};

const TOTAL_UNITS = 64; // total time units to display
const UNIT_WIDTH = 18; // pixels per time unit

export default function AgentTimeline() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [playhead, setPlayhead] = useState(54);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedAgents, setExpandedAgents] = useState(new Set(AGENTS.map(a => a.id)));
  const scrollRef = useRef(null);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlayhead(prev => {
        if (prev >= TOTAL_UNITS) { setIsPlaying(false); return TOTAL_UNITS; }
        return prev + 0.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleAgent = (agentId) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId); else next.add(agentId);
      return next;
    });
  };

  const completedTasks = TIMELINE_EVENTS.filter(e => e.status === 'completed').length;
  const runningTasks = TIMELINE_EVENTS.filter(e => e.status === 'running').length;
  const totalTokens = TIMELINE_EVENTS.reduce((s, e) => s + e.tokens, 0);
  const totalDuration = Math.max(...TIMELINE_EVENTS.map(e => e.start + e.duration));

  const selectedEventData = TIMELINE_EVENTS.find(e => e.id === selectedEvent);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              <Calendar size={22} />
            </div>
            Agent Timeline
          </h2>
          <p>Gantt-chart visualization of multi-agent task execution across time</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { setPlayhead(0); setIsPlaying(false); }}>
            <SkipForward size={14} style={{ transform: 'rotate(180deg)' }} /> Reset
          </button>
          <button
            className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
          <div style={{
            padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-full)',
            background: 'var(--bg-tertiary)', fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)'
          }}>
            T+{playhead.toFixed(0)}s
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}><CheckCircle2 size={18} /></div>
          <div className="stat-value">{completedTasks}/{TIMELINE_EVENTS.length}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}><Loader2 size={18} /></div>
          <div className="stat-value">{runningTasks}</div>
          <div className="stat-label">Running</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}><Users size={18} /></div>
          <div className="stat-value">{AGENTS.length}</div>
          <div className="stat-label">Active Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232,121,249,0.15)', color: '#e879f9' }}><Zap size={18} /></div>
          <div className="stat-value">{(totalTokens / 1000).toFixed(0)}K</div>
          <div className="stat-label">Tokens Used</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem' }}>
        {/* Timeline */}
        <div className="glow-card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <h3><Calendar size={16} /> Execution Timeline</h3>
          </div>
          <div className="card-body" ref={scrollRef} style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 340px)' }}>
            {/* Time ruler */}
            <div style={{ display: 'flex', marginBottom: '0.5rem', paddingLeft: '160px', position: 'relative' }}>
              {Array.from({ length: Math.ceil(TOTAL_UNITS / 4) + 1 }, (_, i) => i * 4).map(t => (
                <div key={t} style={{
                  position: 'absolute', left: `${160 + t * UNIT_WIDTH}px`,
                  fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'
                }}>
                  {t}s
                </div>
              ))}
              {/* Playhead */}
              <div style={{
                position: 'absolute', left: `${160 + playhead * UNIT_WIDTH}px`,
                top: -4, width: 2, height: 'calc(100% + 500px)',
                background: '#fb7185', zIndex: 5,
                boxShadow: '0 0 8px rgba(251,113,133,0.4)'
              }}>
                <div style={{
                  position: 'absolute', top: -2, left: -4,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#fb7185', boxShadow: '0 0 6px rgba(251,113,133,0.5)'
                }} />
              </div>
            </div>

            {/* Agent Rows */}
            <div style={{ marginTop: '1rem' }}>
              {AGENTS.map(agent => {
                const agentEvents = TIMELINE_EVENTS.filter(e => e.agentId === agent.id);
                const isExpanded = expandedAgents.has(agent.id);

                return (
                  <div key={agent.id} style={{ marginBottom: '0.5rem' }}>
                    {/* Agent header */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.4rem 0.5rem', cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      onClick={() => toggleAgent(agent.id)}
                    >
                      {isExpanded ? <ChevronDown size={12} color="var(--text-muted)" /> : <ChevronRight size={12} color="var(--text-muted)" />}
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: agent.color }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, minWidth: '120px' }}>{agent.name}</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        {agentEvents.filter(e => e.status === 'completed').length}/{agentEvents.length} tasks
                      </span>
                    </div>

                    {/* Timeline bars */}
                    {isExpanded && (
                      <div style={{ position: 'relative', height: '36px', marginLeft: '160px', marginBottom: '0.25rem' }}>
                        {/* Grid lines */}
                        {Array.from({ length: Math.ceil(TOTAL_UNITS / 4) + 1 }, (_, i) => i * 4).map(t => (
                          <div key={t} style={{
                            position: 'absolute', left: `${t * UNIT_WIDTH}px`,
                            top: 0, width: 1, height: '100%',
                            background: 'rgba(255,255,255,0.03)'
                          }} />
                        ))}

                        {agentEvents.map(event => {
                          const statusConf = STATUS_CONFIG[event.status];
                          const isActive = event.start <= playhead && (event.start + event.duration) > playhead && event.status !== 'pending';
                          const isPast = (event.start + event.duration) <= playhead;
                          const isFuture = event.start > playhead;

                          return (
                            <div
                              key={event.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(event.id); }}
                              style={{
                                position: 'absolute',
                                left: `${event.start * UNIT_WIDTH}px`,
                                width: `${event.duration * UNIT_WIDTH}px`,
                                top: '4px',
                                height: '28px',
                                borderRadius: 'var(--radius-sm)',
                                background: isFuture ? 'rgba(107,107,128,0.1)' : statusConf.bg,
                                border: `1px solid ${isFuture ? 'rgba(107,107,128,0.15)' : `${statusConf.color}40`}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '0.35rem',
                                gap: '0.25rem',
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                                boxShadow: selectedEvent === event.id ? `0 0 8px ${statusConf.color}40` : 'none',
                                outline: selectedEvent === event.id ? `2px solid ${statusConf.color}` : 'none',
                                animation: isActive ? 'pulse-bar 2s infinite' : 'none'
                              }}
                            >
                              {event.duration * UNIT_WIDTH > 60 && (
                                <span style={{
                                  fontSize: '0.62rem', fontWeight: 500,
                                  color: isFuture ? 'var(--text-muted)' : statusConf.color,
                                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}>
                                  {event.label}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event Inspector */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3><Timer size={16} /> Event Inspector</h3>
          </div>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            {selectedEventData ? (() => {
              const agent = AGENTS.find(a => a.id === selectedEventData.agentId);
              const statusConf = STATUS_CONFIG[selectedEventData.status];
              const StatusIcon = statusConf.icon;
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${agent.color}20`, color: agent.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Calendar size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedEventData.label}</div>
                      <div style={{ fontSize: '0.72rem', color: agent.color }}>{agent.name}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                    <StatusIcon size={14} color={statusConf.color} className={selectedEventData.status === 'running' ? 'animate-spin-slow' : ''} />
                    <span className="badge" style={{ background: statusConf.bg, color: statusConf.color }}>
                      {statusConf.label}
                    </span>
                  </div>

                  {/* Properties */}
                  {[
                    { label: 'Start Time', value: `T+${selectedEventData.start}s` },
                    { label: 'Duration', value: `${selectedEventData.duration}s` },
                    { label: 'End Time', value: `T+${selectedEventData.start + selectedEventData.duration}s` },
                    { label: 'Tokens', value: selectedEventData.tokens > 0 ? `${(selectedEventData.tokens / 1000).toFixed(1)}K` : '—' },
                    { label: 'Model', value: agent.model },
                  ].map(prop => (
                    <div key={prop.label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '0.35rem 0.5rem', marginBottom: '0.2rem',
                      background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem'
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>{prop.label}</span>
                      <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{prop.value}</span>
                    </div>
                  ))}

                  {/* Tools Used */}
                  {selectedEventData.tools.length > 0 && (
                    <>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: '0.3rem', fontWeight: 600 }}>
                        Tools Used
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {selectedEventData.tools.map(tool => (
                          <span key={tool} className="badge" style={{
                            background: 'rgba(34,211,238,0.1)', color: '#22d3ee', fontSize: '0.65rem'
                          }}>
                            {tool}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })() : (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <div className="empty-icon"><Calendar size={24} color="var(--text-muted)" /></div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>Select an Event</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Click any bar on the timeline to inspect
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
