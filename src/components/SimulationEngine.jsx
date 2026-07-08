import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Play, Pause, SkipForward, RotateCcw,
  Zap, Clock, DollarSign, MessageSquare, ChevronRight,
  CheckCircle2, AlertCircle, Loader2, Brain, Cpu, Shield
} from 'lucide-react';

const AGENT_COLORS = {
  Planner: '#818cf8',
  Researcher: '#22d3ee',
  Coder: '#34d399',
  Reviewer: '#fb7185',
};

const SIMULATION_STEPS = [
  {
    agent: 'Planner',
    action: 'THINK',
    thought: 'I need to break down the user request into sub-tasks. The user wants to build a REST API with authentication. Let me identify the components...',
    duration: 1200,
    tokens: 340,
  },
  {
    agent: 'Planner',
    action: 'DELEGATE',
    thought: 'Delegating research task to find the best authentication strategy for this use case.',
    tool: { name: 'delegate_task', args: '{ agent: "Researcher", task: "Find best auth strategy for Node.js REST API" }' },
    duration: 200,
    tokens: 85,
  },
  {
    agent: 'Researcher',
    action: 'TOOL_CALL',
    thought: 'Searching for current best practices in API authentication...',
    tool: { name: 'web_search', args: '"Node.js REST API authentication 2026 best practices"' },
    duration: 2100,
    tokens: 450,
  },
  {
    agent: 'Researcher',
    action: 'OBSERVE',
    thought: 'Found that JWT with RS256 + refresh token rotation is the current gold standard. Passport.js v2 with built-in OIDC support is recommended.',
    duration: 800,
    tokens: 620,
  },
  {
    agent: 'Researcher',
    action: 'RESPOND',
    thought: 'Reporting findings back to the Planner agent with structured recommendations.',
    tool: { name: 'report_to', args: '{ agent: "Planner", findings: { strategy: "JWT RS256", library: "passport.js v2" } }' },
    duration: 300,
    tokens: 180,
  },
  {
    agent: 'Planner',
    action: 'THINK',
    thought: 'Good. Now I have the auth strategy. Let me delegate the implementation to the Coder agent with clear specifications.',
    duration: 900,
    tokens: 280,
  },
  {
    agent: 'Planner',
    action: 'DELEGATE',
    thought: 'Delegating implementation with full spec including auth strategy, endpoints, and middleware requirements.',
    tool: { name: 'delegate_task', args: '{ agent: "Coder", task: "Implement JWT RS256 auth with passport.js v2", spec: {...} }' },
    duration: 200,
    tokens: 420,
  },
  {
    agent: 'Coder',
    action: 'TOOL_CALL',
    thought: 'Creating the authentication middleware with JWT RS256 token signing...',
    tool: { name: 'write_file', args: 'src/middleware/auth.js' },
    duration: 1800,
    tokens: 890,
  },
  {
    agent: 'Coder',
    action: 'TOOL_CALL',
    thought: 'Now creating the user routes with login, register, and token refresh endpoints...',
    tool: { name: 'write_file', args: 'src/routes/auth.js' },
    duration: 2200,
    tokens: 1240,
  },
  {
    agent: 'Coder',
    action: 'RESPOND',
    thought: 'Implementation complete. Sending code to Reviewer for quality assurance.',
    tool: { name: 'submit_for_review', args: '{ agent: "Reviewer", files: ["auth.js", "routes/auth.js"] }' },
    duration: 300,
    tokens: 150,
  },
  {
    agent: 'Reviewer',
    action: 'THINK',
    thought: 'Analyzing the code for security vulnerabilities, best practices, and potential issues. Checking for: SQL injection, improper token storage, missing rate limiting...',
    duration: 1500,
    tokens: 780,
  },
  {
    agent: 'Reviewer',
    action: 'OBSERVE',
    thought: '✅ JWT implementation is correct\n✅ RS256 signing verified\n⚠️ Missing rate limiting on login endpoint\n⚠️ Token refresh should include device fingerprinting\n✅ Input validation present',
    duration: 1000,
    tokens: 520,
  },
  {
    agent: 'Reviewer',
    action: 'RESPOND',
    thought: 'Code review complete. Two improvements suggested: rate limiting and device fingerprinting. Overall quality: 8.5/10.',
    tool: { name: 'review_complete', args: '{ status: "APPROVED_WITH_SUGGESTIONS", score: 8.5 }' },
    duration: 400,
    tokens: 290,
  },
];

const ACTION_ICONS = {
  THINK: Brain,
  DELEGATE: Zap,
  TOOL_CALL: Cpu,
  OBSERVE: Activity,
  RESPOND: MessageSquare,
};

export default function SimulationEngine() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [currentThought, setCurrentThought] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Typewriter effect
  useEffect(() => {
    if (currentStep < 0 || currentStep >= SIMULATION_STEPS.length) return;
    const step = SIMULATION_STEPS[currentStep];
    setIsTyping(true);
    setCurrentThought('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < step.thought.length) {
        setCurrentThought(step.thought.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15 / speed);
    return () => clearInterval(interval);
  }, [currentStep, speed]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || currentStep >= SIMULATION_STEPS.length - 1) {
      if (currentStep >= SIMULATION_STEPS.length - 1) setIsPlaying(false);
      return;
    }
    const step = SIMULATION_STEPS[currentStep >= 0 ? currentStep : 0];
    const timeout = setTimeout(() => {
      nextStep();
    }, (step?.duration || 1000) / speed + 500);
    return () => clearTimeout(timeout);
  }, [isPlaying, currentStep, speed]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [completedSteps]);

  const nextStep = () => {
    const next = currentStep + 1;
    if (next >= SIMULATION_STEPS.length) return;
    setCurrentStep(next);
    const step = SIMULATION_STEPS[next];
    setCompletedSteps(prev => [...prev, { ...step, stepIndex: next }]);
    setTotalTokens(prev => prev + step.tokens);
    setTotalTime(prev => prev + step.duration);
  };

  const reset = () => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setCompletedSteps([]);
    setTotalTokens(0);
    setTotalTime(0);
    setCurrentThought('');
  };

  const cost = (totalTokens / 1000 * 0.003).toFixed(4);
  const progress = SIMULATION_STEPS.length > 0 ? ((currentStep + 1) / SIMULATION_STEPS.length) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
              <Activity size={22} />
            </div>
            Agent Simulation Engine
          </h2>
          <p>Watch multi-agent collaboration unfold step by step with live reasoning</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            className="select"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5x Speed</option>
            <option value={1}>1x Speed</option>
            <option value={2}>2x Speed</option>
            <option value={4}>4x Speed</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
            <Activity size={18} />
          </div>
          <div className="stat-value">{currentStep + 1}/{SIMULATION_STEPS.length}</div>
          <div className="stat-label">Steps Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
            <Zap size={18} />
          </div>
          <div className="stat-value">{totalTokens.toLocaleString()}</div>
          <div className="stat-label">Total Tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
            <DollarSign size={18} />
          </div>
          <div className="stat-value">${cost}</div>
          <div className="stat-label">Estimated Cost</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            <Clock size={18} />
          </div>
          <div className="stat-value">{(totalTime / 1000).toFixed(1)}s</div>
          <div className="stat-label">Elapsed Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>
            <MessageSquare size={18} />
          </div>
          <div className="stat-value">{new Set(completedSteps.map(s => s.agent)).size}/4</div>
          <div className="stat-label">Agents Active</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
              background: 'var(--gradient-primary)',
            }}
          />
        </div>
      </div>

      <div className="grid-sidebar">
        {/* Timeline */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h3><Activity size={16} /> Execution Timeline</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => {
                  if (currentStep >= SIMULATION_STEPS.length - 1) reset();
                  setIsPlaying(!isPlaying);
                }}
              >
                {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={nextStep}
                disabled={currentStep >= SIMULATION_STEPS.length - 1}
              >
                <SkipForward size={14} /> Step
              </button>
            </div>
          </div>
          <div ref={scrollRef} className="card-body" style={{ flex: 1, overflowY: 'auto' }}>
            <div className="timeline">
              {completedSteps.map((step, i) => {
                const ActionIcon = ACTION_ICONS[step.action] || Activity;
                const isLast = i === completedSteps.length - 1;
                return (
                  <div
                    key={i}
                    className={`timeline-step ${isLast ? 'active' : 'completed'}`}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      marginBottom: '0.3rem'
                    }}>
                      <span className="badge" style={{
                        background: `${AGENT_COLORS[step.agent]}20`,
                        color: AGENT_COLORS[step.agent]
                      }}>
                        {step.agent}
                      </span>
                      <span className="badge badge-indigo">
                        <ActionIcon size={10} /> {step.action}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {step.tokens} tokens
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.8rem', color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)',
                      lineHeight: 1.5,
                      fontFamily: step.action === 'THINK' || step.action === 'OBSERVE' ? 'var(--font-sans)' : 'inherit'
                    }}>
                      {isLast ? (
                        <>
                          {currentThought}
                          {isTyping && <span style={{ animation: 'typewriter-blink 0.8s infinite' }}>▌</span>}
                        </>
                      ) : step.thought}
                    </div>
                    {step.tool && (
                      <div className="code-block" style={{ marginTop: '0.5rem' }}>
                        <div className="code-header">
                          <span>🔧 {step.tool.name}</span>
                        </div>
                        <pre style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                          {step.tool.args}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
              {completedSteps.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Play size={24} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Ready to Simulate</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Press Play or Step to begin the multi-agent simulation
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto' }}>
          {/* Active Agent */}
          <div className="glow-card">
            <div className="card-header">
              <h3>🤖 Active Agent</h3>
            </div>
            <div className="card-body">
              {currentStep >= 0 ? (() => {
                const step = SIMULATION_STEPS[currentStep];
                const color = AGENT_COLORS[step.agent];
                return (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: `${color}20`, color: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 0 20px ${color}30`,
                      }}>
                        <Brain size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{step.agent}</div>
                        <span className="badge" style={{ background: `${color}20`, color }}>
                          {step.action}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
                        padding: '0.6rem', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{step.tokens}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tokens</div>
                      </div>
                      <div style={{
                        background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)',
                        padding: '0.6rem', textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{step.duration}ms</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Latency</div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No agent active
                </div>
              )}
            </div>
          </div>

          {/* Agent Summary */}
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3>📊 Agent Summary</h3>
            </div>
            <div className="card-body">
              {Object.entries(AGENT_COLORS).map(([name, color]) => {
                const agentSteps = completedSteps.filter(s => s.agent === name);
                const agentTokens = agentSteps.reduce((sum, s) => sum + s.tokens, 0);
                return (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem', borderRadius: 'var(--radius-md)',
                    marginBottom: '0.5rem',
                    background: agentSteps.length > 0 ? `${color}08` : 'transparent',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${color}20`, color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Brain size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {agentSteps.length} steps · {agentTokens} tokens
                      </div>
                    </div>
                    {agentSteps.length > 0 && (
                      <CheckCircle2 size={16} color={color} />
                    )}
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
