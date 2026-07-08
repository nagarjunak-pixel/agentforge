import React, { useState } from 'react';
import {
  Bug, Play, Pause, SkipForward, ChevronRight, ChevronDown,
  Brain, Wrench, Eye, CheckCircle2, XCircle, AlertTriangle,
  CornerDownRight, GitBranch, MessageSquare, Zap
} from 'lucide-react';

const REASONING_TRACE = [
  {
    id: 1, type: 'thought', depth: 0,
    content: 'The user wants to implement a secure file upload API. Let me analyze the requirements step by step.',
    thinking: 'I need to consider: file size limits, allowed types, virus scanning, storage strategy, and access control.',
    tokens: 125, latency: 340,
    status: 'completed',
  },
  {
    id: 2, type: 'thought', depth: 0,
    content: 'Breaking down into sub-problems: 1) Input validation 2) Storage layer 3) Access control 4) Virus scanning',
    thinking: 'For a production system, I should use multipart form data with streaming to handle large files without OOM.',
    tokens: 180, latency: 280,
    status: 'completed',
    children: [
      {
        id: 21, type: 'branch', depth: 1,
        content: 'Sub-problem 1: Input Validation',
        thinking: 'Need to validate: file size (max 50MB), MIME type (images/documents only), filename sanitization',
        tokens: 95, latency: 150,
        status: 'completed',
      },
      {
        id: 22, type: 'branch', depth: 1,
        content: 'Sub-problem 2: Storage Layer',
        thinking: 'Comparing options: Local disk vs Cloud Storage vs S3. For scalability, Cloud Storage with signed URLs is best.',
        tokens: 120, latency: 200,
        status: 'completed',
      },
    ]
  },
  {
    id: 3, type: 'tool_call', depth: 0,
    content: 'Reading existing codebase to understand project structure and existing middleware patterns.',
    tool: 'read_file',
    toolArgs: 'src/middleware/index.ts',
    toolResult: '// Existing middleware: cors, helmet, rateLimit, auth\nexport { corsMiddleware, helmetConfig, rateLimiter, authGuard };',
    tokens: 280, latency: 120,
    status: 'completed',
  },
  {
    id: 4, type: 'thought', depth: 0,
    content: 'Good — the project already has auth middleware. I can extend it for file upload permissions.',
    thinking: 'The existing rateLimiter can be configured with stricter limits for upload endpoints. authGuard needs file permission check.',
    tokens: 160, latency: 310,
    status: 'completed',
  },
  {
    id: 5, type: 'tool_call', depth: 0,
    content: 'Searching for existing file handling code or dependencies.',
    tool: 'grep_search',
    toolArgs: 'query: "multer|busboy|formidable|multipart" in package.json',
    toolResult: 'No matches found in package.json',
    tokens: 85, latency: 45,
    status: 'completed',
  },
  {
    id: 6, type: 'thought', depth: 0,
    content: 'No file handling library installed. I\'ll use Busboy for streaming multipart parsing — it\'s more memory-efficient than Multer for large files.',
    thinking: 'Busboy streams directly to Cloud Storage, avoiding loading entire file into memory. Important for production.',
    tokens: 140, latency: 260,
    status: 'completed',
  },
  {
    id: 7, type: 'tool_call', depth: 0,
    content: 'Writing the file upload middleware with streaming support.',
    tool: 'write_file',
    toolArgs: 'src/middleware/upload.ts',
    toolResult: 'File created: src/middleware/upload.ts (142 lines)',
    tokens: 890, latency: 1200,
    status: 'completed',
  },
  {
    id: 8, type: 'self_critique', depth: 0,
    content: '⚠️ Wait — I forgot to add virus scanning. For production, files should be scanned before making them accessible.',
    thinking: 'Options: ClamAV integration, Google Safe Browsing API, or Cloud DLP. ClamAV is self-hosted and free.',
    tokens: 120, latency: 180,
    status: 'warning',
  },
  {
    id: 9, type: 'tool_call', depth: 0,
    content: 'Adding virus scanning step to the upload pipeline.',
    tool: 'write_file',
    toolArgs: 'src/services/virusScan.ts',
    toolResult: 'File created: src/services/virusScan.ts (68 lines)',
    tokens: 450, latency: 800,
    status: 'completed',
  },
  {
    id: 10, type: 'tool_call', depth: 0,
    content: 'Writing the upload route with all security measures.',
    tool: 'write_file',
    toolArgs: 'src/routes/upload.ts',
    toolResult: 'File created: src/routes/upload.ts (95 lines)',
    tokens: 620, latency: 950,
    status: 'completed',
  },
  {
    id: 11, type: 'verification', depth: 0,
    content: '✅ Final verification checklist:\n• File size limit: 50MB ✓\n• MIME type validation ✓\n• Filename sanitization ✓\n• Streaming upload ✓\n• Virus scanning ✓\n• Signed URL access ✓\n• Rate limiting ✓\n• Auth required ✓',
    thinking: 'All security requirements are met. The implementation follows the principle of defense in depth.',
    tokens: 200, latency: 350,
    status: 'completed',
  },
];

const TYPE_CONFIG = {
  thought: { icon: Brain, color: '#818cf8', label: 'Reasoning' },
  tool_call: { icon: Wrench, color: '#22d3ee', label: 'Tool Call' },
  self_critique: { icon: AlertTriangle, color: '#fbbf24', label: 'Self-Critique' },
  verification: { icon: CheckCircle2, color: '#34d399', label: 'Verification' },
  branch: { icon: GitBranch, color: '#a78bfa', label: 'Branch' },
  observation: { icon: Eye, color: '#e879f9', label: 'Observation' },
};

const STATUS_ICONS = {
  completed: { icon: CheckCircle2, color: '#34d399' },
  warning: { icon: AlertTriangle, color: '#fbbf24' },
  error: { icon: XCircle, color: '#fb7185' },
  running: { icon: Play, color: '#818cf8' },
};

export default function ReasoningDebugger() {
  const [activeStep, setActiveStep] = useState(0);
  const [expandedSteps, setExpandedSteps] = useState(new Set([2]));
  const [showThinking, setShowThinking] = useState(true);
  const [breakpoints, setBreakpoints] = useState(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(REASONING_TRACE.length);

  const toggleExpand = (id) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleBreakpoint = (idx) => {
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const totalTokens = REASONING_TRACE.reduce((s, step) => {
    let t = step.tokens;
    if (step.children) t += step.children.reduce((cs, c) => cs + c.tokens, 0);
    return s + t;
  }, 0);

  const totalLatency = REASONING_TRACE.reduce((s, step) => {
    let t = step.latency;
    if (step.children) t += step.children.reduce((cs, c) => cs + c.latency, 0);
    return s + t;
  }, 0);

  const activeStepData = REASONING_TRACE[activeStep];

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>
              <Bug size={22} />
            </div>
            Reasoning Trace Debugger
          </h2>
          <p>Step-through debugger for agent reasoning with chain-of-thought visualization</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="toggle-container" onClick={() => setShowThinking(!showThinking)}>
            <div className={`toggle-track ${showThinking ? 'active' : ''}`}>
              <div className="toggle-thumb" />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Show Thinking</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}><Brain size={18} /></div>
          <div className="stat-value">{REASONING_TRACE.length}</div>
          <div className="stat-label">Reasoning Steps</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}><Wrench size={18} /></div>
          <div className="stat-value">{REASONING_TRACE.filter(s => s.type === 'tool_call').length}</div>
          <div className="stat-label">Tool Calls</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}><Zap size={18} /></div>
          <div className="stat-value">{totalTokens.toLocaleString()}</div>
          <div className="stat-label">Total Tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}><CheckCircle2 size={18} /></div>
          <div className="stat-value">{(totalLatency / 1000).toFixed(1)}s</div>
          <div className="stat-label">Total Time</div>
        </div>
      </div>

      <div className="grid-sidebar">
        {/* Reasoning Timeline */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h3><Brain size={16} /> Reasoning Chain</h3>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              >
                ← Prev
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveStep(Math.min(REASONING_TRACE.length - 1, activeStep + 1))}
              >
                Next →
              </button>
            </div>
          </div>
          <div className="card-body" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="timeline">
              {REASONING_TRACE.map((step, idx) => {
                const config = TYPE_CONFIG[step.type];
                const StatusIcon = STATUS_ICONS[step.status]?.icon || CheckCircle2;
                const statusColor = STATUS_ICONS[step.status]?.color || '#34d399';
                const Icon = config.icon;
                const isActive = idx === activeStep;
                const hasBreakpoint = breakpoints.has(idx);
                const isExpanded = expandedSteps.has(idx);

                return (
                  <div key={step.id}>
                    <div
                      className={`timeline-step ${isActive ? 'active' : step.status === 'completed' ? 'completed' : ''} ${step.status === 'warning' ? 'error' : ''}`}
                      onClick={() => setActiveStep(idx)}
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {/* Breakpoint indicator */}
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleBreakpoint(idx); }}
                        style={{
                          position: 'absolute', left: '-2.5rem', top: '1rem',
                          width: 14, height: 14, borderRadius: '50%', cursor: 'pointer',
                          background: hasBreakpoint ? '#fb7185' : 'transparent',
                          border: hasBreakpoint ? '2px solid #fb7185' : '2px solid transparent',
                          transition: 'all 0.15s',
                          boxShadow: hasBreakpoint ? '0 0 8px rgba(251,113,133,0.5)' : 'none'
                        }}
                        title="Toggle breakpoint"
                      />

                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginBottom: '0.3rem'
                      }}>
                        <span className="badge" style={{ background: `${config.color}20`, color: config.color }}>
                          <Icon size={10} /> {config.label}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Step {idx + 1}
                        </span>
                        <StatusIcon size={14} color={statusColor} style={{ marginLeft: 'auto' }} />
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {step.tokens}t · {step.latency}ms
                        </span>
                      </div>

                      <div style={{
                        fontSize: '0.82rem',
                        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {step.content}
                      </div>

                      {showThinking && step.thinking && (
                        <div style={{
                          marginTop: '0.5rem', padding: '0.6rem 0.8rem',
                          background: 'rgba(129,140,248,0.06)',
                          borderLeft: '3px solid rgba(129,140,248,0.3)',
                          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                          fontSize: '0.75rem', color: 'var(--text-muted)',
                          fontStyle: 'italic'
                        }}>
                          💭 {step.thinking}
                        </div>
                      )}

                      {step.tool && (
                        <div className="code-block" style={{ marginTop: '0.5rem' }}>
                          <div className="code-header">
                            <span>🔧 {step.tool}({step.toolArgs})</span>
                          </div>
                          {step.toolResult && (
                            <pre style={{ fontSize: '0.72rem', color: 'var(--accent-emerald)', whiteSpace: 'pre-wrap' }}>
                              {step.toolResult}
                            </pre>
                          )}
                        </div>
                      )}

                      {/* Expandable children */}
                      {step.children && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(idx); }}
                            style={{ fontSize: '0.72rem' }}
                          >
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            {step.children.length} sub-branches
                          </button>
                          {isExpanded && (
                            <div style={{ marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid rgba(167,139,250,0.2)' }}>
                              {step.children.map(child => {
                                const childConfig = TYPE_CONFIG[child.type];
                                const ChildIcon = childConfig.icon;
                                return (
                                  <div key={child.id} style={{
                                    padding: '0.5rem', marginBottom: '0.4rem',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(167,139,250,0.05)'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                                      <CornerDownRight size={12} color="var(--text-muted)" />
                                      <span className="badge" style={{ background: `${childConfig.color}20`, color: childConfig.color, fontSize: '0.6rem' }}>
                                        <ChildIcon size={9} /> {childConfig.label}
                                      </span>
                                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                                        {child.tokens}t · {child.latency}ms
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {child.content}
                                    </div>
                                    {showThinking && child.thinking && (
                                      <div style={{
                                        marginTop: '0.3rem', fontSize: '0.7rem',
                                        color: 'var(--text-muted)', fontStyle: 'italic'
                                      }}>
                                        💭 {child.thinking}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto' }}>
          {/* Step Inspector */}
          <div className="glow-card">
            <div className="card-header">
              <h3><Eye size={16} /> Step Inspector</h3>
              <span className="badge badge-indigo">Step {activeStep + 1}</span>
            </div>
            <div className="card-body">
              {activeStepData && (() => {
                const config = TYPE_CONFIG[activeStepData.type];
                const Icon = config.icon;
                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: `${config.color}20`, color: config.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{config.label}</div>
                        <span className="badge" style={{
                          background: `${STATUS_ICONS[activeStepData.status]?.color}20`,
                          color: STATUS_ICONS[activeStepData.status]?.color
                        }}>
                          {activeStepData.status}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '0.6rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: config.color }}>{activeStepData.tokens}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tokens</div>
                      </div>
                      <div style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', padding: '0.6rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: config.color }}>{activeStepData.latency}ms</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Latency</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Content</div>
                      <div style={{
                        fontSize: '0.82rem', lineHeight: 1.6,
                        padding: '0.75rem', background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)', whiteSpace: 'pre-wrap'
                      }}>
                        {activeStepData.content}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Breakpoints */}
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3>🔴 Breakpoints</h3>
              <span className="badge badge-rose">{breakpoints.size}</span>
            </div>
            <div className="card-body">
              {breakpoints.size === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  Click the left gutter in the timeline to add breakpoints
                </div>
              ) : (
                [...breakpoints].sort().map(idx => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.5rem', marginBottom: '0.3rem',
                    borderRadius: 'var(--radius-sm)', background: 'rgba(251,113,133,0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%', background: '#fb7185',
                        boxShadow: '0 0 6px rgba(251,113,133,0.5)'
                      }} />
                      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Step {idx + 1}</span>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => toggleBreakpoint(idx)}
                      style={{ padding: '0.15rem', fontSize: '0.7rem' }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
