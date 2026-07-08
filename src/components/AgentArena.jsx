import React, { useState, useEffect, useRef } from 'react';
import {
  Swords, Play, Pause, RotateCcw, Send, Users,
  Brain, Award, TrendingUp, MessageSquare, Zap,
  ThumbsUp, ThumbsDown, Scale
} from 'lucide-react';

const AGENTS_CONFIG = [
  { id: 'strategist', name: 'Strategist', model: 'gemini-2.5-pro', color: '#818cf8', avatar: '🧠', personality: 'Analytical and strategic, focuses on planning and architecture' },
  { id: 'creative', name: 'Creative', model: 'claude-opus-4', color: '#e879f9', avatar: '🎨', personality: 'Creative problem solver, thinks outside the box' },
  { id: 'pragmatist', name: 'Pragmatist', model: 'gemini-2.5-flash', color: '#34d399', avatar: '⚡', personality: 'Practical and efficient, focuses on deliverables and timelines' },
  { id: 'critic', name: 'Devil\'s Advocate', model: 'gemini-2.5-pro', color: '#fb7185', avatar: '😈', personality: 'Questions assumptions, finds edge cases and weaknesses' },
];

const DEBATE_TOPIC = "Should we use a microservices architecture or a modular monolith for our new e-commerce platform?";

const DEBATE_MESSAGES = [
  {
    agent: 'strategist',
    content: "Let me frame this decision with our key constraints: we have a team of 8 engineers, we need to launch MVP in 3 months, and we expect to scale to 10K concurrent users within the first year. Given these constraints, I recommend **starting with a modular monolith** and extracting services only when proven necessary.",
    reasoning: "Conway's Law suggests our architecture should mirror our team structure. With 8 engineers, managing multiple services adds unnecessary overhead.",
    votes: { agree: 2, disagree: 1 },
    tokens: 245,
  },
  {
    agent: 'creative',
    content: "I see the pragmatic appeal, but consider this: what if we use a **hybrid approach**? We could build a modular monolith with clearly defined domain boundaries, but deploy the payment and inventory modules as separate services from day one. These are the most critical for compliance and scalability. Think of it as 'monolith-first with strategic service extraction.'",
    reasoning: "Payment processing has different scaling characteristics and compliance requirements than catalog browsing. Separating these early prevents painful migrations later.",
    votes: { agree: 3, disagree: 0 },
    tokens: 310,
  },
  {
    agent: 'pragmatist',
    content: "Numbers don't lie. Let me share some data:\n\n• **Time to deploy monolith MVP**: ~10 weeks\n• **Time to deploy microservices MVP**: ~16-18 weeks\n• **Infrastructure cost (monolith)**: $200/mo\n• **Infrastructure cost (microservices)**: $800-1200/mo\n\nThe hybrid approach adds ~2 weeks but gives us a clean migration path. I'm backing the Creative's proposal, but with one condition: we must establish a **clear extraction criteria** before writing code.",
    reasoning: "Without extraction criteria, 'we'll extract when needed' becomes 'we never extract and accumulate tech debt.'",
    votes: { agree: 3, disagree: 0 },
    tokens: 280,
  },
  {
    agent: 'critic',
    content: "Hold on. Everyone's assuming the modular monolith will actually stay modular. In my experience, **module boundaries erode** within 6 months without strict enforcement. What's your plan for preventing cross-module dependencies? A linter? Architecture tests? Code review policies?\n\nAlso, the Creative's hybrid approach introduces distributed transaction complexity for orders that span payment + inventory. Have you thought about **saga patterns** or **eventual consistency** tradeoffs?",
    reasoning: "The biggest risk isn't the initial architecture choice — it's the discipline to maintain boundaries. Without concrete enforcement mechanisms, any modular design degrades into a big ball of mud.",
    votes: { agree: 2, disagree: 1 },
    tokens: 340,
  },
  {
    agent: 'strategist',
    content: "Excellent challenge. Here's my revised proposal incorporating all perspectives:\n\n1. **Modular monolith** for core business logic (catalog, users, search)\n2. **Separate payment service** (compliance isolation)\n3. **Architecture Decision Records (ADRs)** for every module boundary\n4. **ArchUnit tests** to enforce module dependencies at CI level\n5. **Monthly architecture review** to evaluate extraction candidates\n\nThis gives us speed, safety, and a clear governance model.",
    reasoning: "The Critic raised a valid point about boundary erosion. ADRs and automated architecture tests are the enforcement mechanisms we need.",
    votes: { agree: 4, disagree: 0 },
    tokens: 295,
  },
  {
    agent: 'creative',
    content: "I love it. And one more creative addition: let's use **feature flags** for the module boundaries themselves. If we wrap inter-module calls with flags, we can literally A/B test 'monolith mode' vs 'service mode' for specific modules. This turns the architecture decision from a one-way door into a two-way door. 🚪↔️",
    reasoning: "Making architectural decisions reversible dramatically reduces risk and enables data-driven decision making about when to extract services.",
    votes: { agree: 3, disagree: 1 },
    tokens: 220,
  },
];

export default function AgentArena() {
  const [messages, setMessages] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showReasoning, setShowReasoning] = useState(true);
  const [consensusScore, setConsensusScore] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || currentIdx >= DEBATE_MESSAGES.length) {
      if (currentIdx >= DEBATE_MESSAGES.length) setIsPlaying(false);
      return;
    }
    const timeout = setTimeout(() => {
      setMessages(prev => [...prev, DEBATE_MESSAGES[currentIdx]]);
      setCurrentIdx(prev => prev + 1);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [isPlaying, currentIdx]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) { setConsensusScore(0); return; }
    const totalAgree = messages.reduce((s, m) => s + m.votes.agree, 0);
    const totalDisagree = messages.reduce((s, m) => s + m.votes.disagree, 0);
    setConsensusScore(Math.round((totalAgree / (totalAgree + totalDisagree)) * 100));
  }, [messages]);

  const reset = () => {
    setMessages([]);
    setCurrentIdx(0);
    setIsPlaying(false);
    setSelectedMsg(null);
    setConsensusScore(0);
  };

  const addNext = () => {
    if (currentIdx >= DEBATE_MESSAGES.length) return;
    setMessages(prev => [...prev, DEBATE_MESSAGES[currentIdx]]);
    setCurrentIdx(prev => prev + 1);
  };

  const totalTokens = messages.reduce((s, m) => s + m.tokens, 0);
  const participatingAgents = new Set(messages.map(m => m.agent));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(232,121,249,0.15)', color: '#e879f9' }}>
              <Swords size={22} />
            </div>
            Multi-Agent Debate Arena
          </h2>
          <p>Watch AI agents collaborate and debate to reach consensus on complex decisions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="toggle-container" onClick={() => setShowReasoning(!showReasoning)}>
            <div className={`toggle-track ${showReasoning ? 'active' : ''}`}>
              <div className="toggle-thumb" />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Show Reasoning</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button className="btn btn-secondary btn-sm" onClick={addNext} disabled={currentIdx >= DEBATE_MESSAGES.length}>
            <Send size={14} /> Next Turn
          </button>
          <button
            className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (currentIdx >= DEBATE_MESSAGES.length) reset();
              setIsPlaying(!isPlaying);
            }}
          >
            {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Auto-Play</>}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232,121,249,0.15)', color: '#e879f9' }}><Users size={18} /></div>
          <div className="stat-value">{participatingAgents.size}/{AGENTS_CONFIG.length}</div>
          <div className="stat-label">Agents Participating</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}><MessageSquare size={18} /></div>
          <div className="stat-value">{messages.length}/{DEBATE_MESSAGES.length}</div>
          <div className="stat-label">Debate Turns</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}><Zap size={18} /></div>
          <div className="stat-value">{totalTokens.toLocaleString()}</div>
          <div className="stat-label">Total Tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: consensusScore > 70 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)', color: consensusScore > 70 ? '#34d399' : '#fbbf24' }}>
            <Scale size={18} />
          </div>
          <div className="stat-value">{consensusScore}%</div>
          <div className="stat-label">Consensus Level</div>
        </div>
      </div>

      {/* Topic Card */}
      <div className="glow-card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-fuchsia">DEBATE TOPIC</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600 }}>{DEBATE_TOPIC}</div>
        </div>
      </div>

      <div className="grid-sidebar">
        {/* Chat Arena */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h3><Swords size={16} /> Debate Transcript</h3>
          </div>
          <div ref={scrollRef} className="card-body" style={{
            flex: 1, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            {messages.map((msg, i) => {
              const agent = AGENTS_CONFIG.find(a => a.id === msg.agent);
              return (
                <div
                  key={i}
                  className="message-bubble agent"
                  onClick={() => setSelectedMsg(msg)}
                  style={{
                    cursor: 'pointer', maxWidth: '90%',
                    borderColor: selectedMsg === msg ? agent.color : 'var(--border-color)',
                    boxShadow: selectedMsg === msg ? `0 0 15px ${agent.color}20` : 'none'
                  }}
                >
                  <div className="agent-name" style={{ color: agent.color }}>
                    <span style={{ fontSize: '1.1rem' }}>{agent.avatar}</span>
                    <span style={{ fontWeight: 700 }}>{agent.name}</span>
                    <span className="badge" style={{
                      background: `${agent.color}15`, color: agent.color, fontSize: '0.6rem'
                    }}>
                      {agent.model}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      {msg.tokens} tokens
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>

                  {showReasoning && msg.reasoning && (
                    <div style={{
                      marginTop: '0.6rem', padding: '0.5rem 0.7rem',
                      background: 'rgba(129,140,248,0.05)',
                      borderLeft: `3px solid ${agent.color}40`,
                      borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                      fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic'
                    }}>
                      💭 {msg.reasoning}
                    </div>
                  )}

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    marginTop: '0.6rem', paddingTop: '0.4rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--accent-emerald)' }}>
                      <ThumbsUp size={12} /> {msg.votes.agree}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--accent-rose)' }}>
                      <ThumbsDown size={12} /> {msg.votes.disagree}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                      Turn {i + 1}
                    </div>
                  </div>
                </div>
              );
            })}

            {messages.length === 0 && (
              <div className="empty-state" style={{ flex: 1 }}>
                <div className="empty-icon"><Swords size={24} color="var(--text-muted)" /></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Arena Ready</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Press Play to start the multi-agent debate
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto' }}>
          {/* Agent Roster */}
          <div className="glow-card">
            <div className="card-header">
              <h3><Users size={16} /> Agent Roster</h3>
            </div>
            <div className="card-body">
              {AGENTS_CONFIG.map(agent => {
                const agentMsgs = messages.filter(m => m.agent === agent.id);
                const isActive = participatingAgents.has(agent.id);
                return (
                  <div key={agent.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.6rem', borderRadius: 'var(--radius-md)',
                    background: isActive ? `${agent.color}08` : 'transparent',
                    marginBottom: '0.4rem'
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${agent.color}15`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {agent.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: agent.color }}>
                        {agent.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {agent.model} · {agentMsgs.length} turns
                      </div>
                    </div>
                    {isActive && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: '#34d399',
                        boxShadow: '0 0 8px rgba(52,211,153,0.5)',
                        animation: 'pulse-dot 2s infinite'
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consensus Tracker */}
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3><Scale size={16} /> Consensus Tracker</h3>
            </div>
            <div className="card-body">
              {/* Visual gauge */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: `conic-gradient(${consensusScore > 70 ? '#34d399' : '#fbbf24'} ${consensusScore * 3.6}deg, var(--bg-tertiary) 0)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto', position: 'relative'
                }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: '50%',
                    background: 'var(--bg-card)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{consensusScore}%</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Consensus</div>
                  </div>
                </div>
              </div>

              {/* Per-turn consensus */}
              {messages.map((msg, i) => {
                const agent = AGENTS_CONFIG.find(a => a.id === msg.agent);
                const total = msg.votes.agree + msg.votes.disagree;
                const pct = total > 0 ? Math.round((msg.votes.agree / total) * 100) : 0;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem', marginBottom: '0.3rem', fontSize: '0.72rem'
                  }}>
                    <span style={{ width: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {i + 1}
                    </span>
                    <span style={{ color: agent.color }}>{agent.avatar}</span>
                    <div className="progress-bar" style={{ flex: 1, height: '4px' }}>
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: pct > 70 ? '#34d399' : '#fbbf24'
                      }} />
                    </div>
                    <span style={{ color: 'var(--text-muted)', minWidth: '30px', textAlign: 'right' }}>
                      {pct}%
                    </span>
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
