import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Play, RotateCcw, Award, BarChart3,
  CheckCircle2, XCircle, Clock, Zap, TrendingUp,
  Target, Brain, Cpu, Shield
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, LineChart, Line,
  Cell
} from 'recharts';

const BENCHMARKS = [
  { id: 'coding', name: 'Code Generation', icon: Cpu, weight: 0.25 },
  { id: 'reasoning', name: 'Multi-Step Reasoning', icon: Brain, weight: 0.20 },
  { id: 'tool_use', name: 'Tool Use Accuracy', icon: Target, weight: 0.20 },
  { id: 'planning', name: 'Task Planning', icon: TrendingUp, weight: 0.15 },
  { id: 'safety', name: 'Safety & Guardrails', icon: Shield, weight: 0.10 },
  { id: 'efficiency', name: 'Token Efficiency', icon: Zap, weight: 0.10 },
];

const AGENT_CONFIGS = [
  {
    id: 'alpha', name: 'Agent Alpha', model: 'gemini-2.5-pro', color: '#818cf8',
    scores: { coding: 92, reasoning: 88, tool_use: 95, planning: 85, safety: 90, efficiency: 78 },
    latency: 420, tokens: 12500, cost: 0.038,
  },
  {
    id: 'beta', name: 'Agent Beta', model: 'claude-opus-4', color: '#22d3ee',
    scores: { coding: 95, reasoning: 92, tool_use: 88, planning: 90, safety: 94, efficiency: 72 },
    latency: 680, tokens: 18200, cost: 0.055,
  },
  {
    id: 'gamma', name: 'Agent Gamma', model: 'gemini-2.5-flash', color: '#34d399',
    scores: { coding: 78, reasoning: 75, tool_use: 82, planning: 72, safety: 88, efficiency: 95 },
    latency: 180, tokens: 6800, cost: 0.012,
  },
  {
    id: 'delta', name: 'Agent Delta', model: 'gpt-4.1', color: '#fbbf24',
    scores: { coding: 90, reasoning: 85, tool_use: 91, planning: 88, safety: 92, efficiency: 80 },
    latency: 520, tokens: 14600, cost: 0.044,
  },
];

const TEST_CASES = [
  { id: 1, name: 'REST API Implementation', category: 'coding', difficulty: 'Hard', results: { alpha: 'pass', beta: 'pass', gamma: 'fail', delta: 'pass' } },
  { id: 2, name: 'Multi-hop Question Answering', category: 'reasoning', difficulty: 'Medium', results: { alpha: 'pass', beta: 'pass', gamma: 'pass', delta: 'pass' } },
  { id: 3, name: 'File System Navigation', category: 'tool_use', difficulty: 'Easy', results: { alpha: 'pass', beta: 'pass', gamma: 'pass', delta: 'pass' } },
  { id: 4, name: 'Project Decomposition', category: 'planning', difficulty: 'Hard', results: { alpha: 'pass', beta: 'pass', gamma: 'fail', delta: 'pass' } },
  { id: 5, name: 'SQL Injection Prevention', category: 'safety', difficulty: 'Medium', results: { alpha: 'pass', beta: 'pass', gamma: 'pass', delta: 'pass' } },
  { id: 6, name: 'Recursive Algorithm', category: 'coding', difficulty: 'Hard', results: { alpha: 'pass', beta: 'pass', gamma: 'partial', delta: 'pass' } },
  { id: 7, name: 'Ambiguous Requirements', category: 'reasoning', difficulty: 'Hard', results: { alpha: 'pass', beta: 'pass', gamma: 'fail', delta: 'partial' } },
  { id: 8, name: 'API Chain Execution', category: 'tool_use', difficulty: 'Hard', results: { alpha: 'pass', beta: 'partial', gamma: 'pass', delta: 'pass' } },
  { id: 9, name: 'Token-Efficient Summary', category: 'efficiency', difficulty: 'Medium', results: { alpha: 'partial', beta: 'fail', gamma: 'pass', delta: 'partial' } },
  { id: 10, name: 'Prompt Injection Resistance', category: 'safety', difficulty: 'Hard', results: { alpha: 'pass', beta: 'pass', gamma: 'partial', delta: 'pass' } },
];

const RESULT_COLORS = { pass: '#34d399', partial: '#fbbf24', fail: '#fb7185' };
const DIFFICULTY_COLORS = { Easy: '#34d399', Medium: '#fbbf24', Hard: '#fb7185' };

export default function EvalSandbox() {
  const [isRunning, setIsRunning] = useState(false);
  const [completedTests, setCompletedTests] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isRunning) return;
    if (completedTests >= TEST_CASES.length) {
      setIsRunning(false);
      return;
    }
    const timeout = setTimeout(() => {
      setCompletedTests(prev => prev + 1);
    }, 600);
    return () => clearTimeout(timeout);
  }, [isRunning, completedTests]);

  const radarData = BENCHMARKS.map(b => {
    const item = { benchmark: b.name };
    AGENT_CONFIGS.forEach(a => {
      item[a.name] = a.scores[b.id];
    });
    return item;
  });

  const barData = AGENT_CONFIGS.map(a => {
    const weightedScore = BENCHMARKS.reduce((sum, b) => sum + (a.scores[b.id] * b.weight), 0);
    return {
      name: a.name,
      score: Math.round(weightedScore),
      latency: a.latency,
      tokens: a.tokens,
      cost: a.cost,
      fill: a.color
    };
  });

  const reset = () => {
    setCompletedTests(0);
    setIsRunning(false);
  };

  const winner = barData.reduce((best, curr) => curr.score > best.score ? curr : best, barData[0]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
              <FlaskConical size={22} />
            </div>
            Evaluation Sandbox
          </h2>
          <p>Benchmark and compare agent performance across coding, reasoning, tool use, and safety</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button
            className={`btn btn-sm ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (completedTests >= TEST_CASES.length) reset();
              setIsRunning(!isRunning);
            }}
          >
            <Play size={14} /> {isRunning ? 'Stop' : completedTests > 0 ? 'Resume' : 'Run Benchmark'}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Benchmark Progress: {completedTests}/{TEST_CASES.length} tests
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {Math.round((completedTests / TEST_CASES.length) * 100)}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div className="progress-fill" style={{
            width: `${(completedTests / TEST_CASES.length) * 100}%`,
            background: 'var(--gradient-primary)'
          }} />
        </div>
      </div>

      {/* Agent Score Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {AGENT_CONFIGS.map(agent => {
          const weightedScore = BENCHMARKS.reduce((sum, b) => sum + (agent.scores[b.id] * b.weight), 0);
          const isWinner = winner.name === agent.name && completedTests >= TEST_CASES.length;
          return (
            <div
              key={agent.id}
              className="stat-card"
              style={{
                cursor: 'pointer',
                borderColor: selectedAgent === agent.id ? agent.color : isWinner ? '#fbbf24' : 'var(--border-color)',
                boxShadow: isWinner ? '0 0 25px rgba(251,191,36,0.2)' : selectedAgent === agent.id ? `0 0 20px ${agent.color}20` : 'none'
              }}
              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            >
              {isWinner && (
                <div style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  background: '#fbbf24', borderRadius: '50%',
                  width: 28, height: 28, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(251,191,36,0.5)'
                }}>
                  <Award size={14} color="#000" />
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem'
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${agent.color}20`, color: agent.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1rem'
                }}>
                  {Math.round(weightedScore)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{agent.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{agent.model}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem', fontSize: '0.65rem' }}>
                <div style={{ textAlign: 'center', padding: '0.3rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700 }}>{agent.latency}ms</div>
                  <div style={{ color: 'var(--text-muted)' }}>Latency</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.3rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700 }}>{(agent.tokens / 1000).toFixed(1)}K</div>
                  <div style={{ color: 'var(--text-muted)' }}>Tokens</div>
                </div>
                <div style={{ textAlign: 'center', padding: '0.3rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700 }}>${agent.cost}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Cost</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem', width: 'fit-content' }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Radar Overview
        </button>
        <button className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`} onClick={() => setActiveTab('comparison')}>
          Score Comparison
        </button>
        <button className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
          Test Results
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid-2">
          {/* Radar Chart */}
          <div className="glow-card">
            <div className="card-header">
              <h3><Target size={16} /> Capability Radar</h3>
            </div>
            <div className="card-body" style={{ height: '380px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="benchmark" tick={{ fill: '#a0a0b8', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b6b80', fontSize: 10 }} />
                  {AGENT_CONFIGS.map(agent => (
                    <Radar
                      key={agent.id}
                      name={agent.name}
                      dataKey={agent.name}
                      stroke={agent.color}
                      fill={agent.color}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-benchmark breakdown */}
          <div className="glow-card">
            <div className="card-header">
              <h3><BarChart3 size={16} /> Benchmark Breakdown</h3>
            </div>
            <div className="card-body" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {BENCHMARKS.map(bench => {
                const Icon = bench.icon;
                return (
                  <div key={bench.id} style={{ marginBottom: '1rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      marginBottom: '0.4rem'
                    }}>
                      <Icon size={14} color="var(--text-secondary)" />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{bench.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        Weight: {bench.weight * 100}%
                      </span>
                    </div>
                    {AGENT_CONFIGS.map(agent => (
                      <div key={agent.id} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        marginBottom: '0.25rem', paddingLeft: '1.5rem'
                      }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: agent.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', width: '80px' }}>
                          {agent.name}
                        </span>
                        <div className="progress-bar" style={{ flex: 1, height: '5px' }}>
                          <div className="progress-fill" style={{
                            width: `${agent.scores[bench.id]}%`,
                            background: agent.color
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 600,
                          fontFamily: 'var(--font-mono)', minWidth: '30px', textAlign: 'right',
                          color: agent.scores[bench.id] > 85 ? '#34d399' : agent.scores[bench.id] > 70 ? '#fbbf24' : '#fb7185'
                        }}>
                          {agent.scores[bench.id]}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'comparison' && (
        <div className="glow-card">
          <div className="card-header">
            <h3><BarChart3 size={16} /> Weighted Score Comparison</h3>
          </div>
          <div className="card-body" style={{ height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip />
                <Bar dataKey="score" name="Weighted Score" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className="glow-card">
          <div className="card-header">
            <h3><FlaskConical size={16} /> Test Case Results</h3>
            <span className="badge badge-indigo">{completedTests}/{TEST_CASES.length} completed</span>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Test Case</th>
                  <th style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>Difficulty</th>
                  {AGENT_CONFIGS.map(a => (
                    <th key={a.id} style={{ padding: '0.6rem', textAlign: 'center', color: a.color, fontWeight: 600 }}>
                      {a.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TEST_CASES.slice(0, completedTests).map((test, i) => (
                  <tr key={test.id} style={{
                    borderBottom: '1px solid var(--border-color)',
                    animation: i === completedTests - 1 ? 'slide-up 0.3s ease-out' : 'none'
                  }}>
                    <td style={{ padding: '0.6rem', color: 'var(--text-muted)' }}>{test.id}</td>
                    <td style={{ padding: '0.6rem', fontWeight: 500 }}>{test.name}</td>
                    <td style={{ padding: '0.6rem' }}>
                      <span className="badge badge-indigo">{test.category}</span>
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <span className="badge" style={{
                        background: `${DIFFICULTY_COLORS[test.difficulty]}15`,
                        color: DIFFICULTY_COLORS[test.difficulty]
                      }}>
                        {test.difficulty}
                      </span>
                    </td>
                    {AGENT_CONFIGS.map(a => {
                      const result = test.results[a.id];
                      return (
                        <td key={a.id} style={{ padding: '0.6rem', textAlign: 'center' }}>
                          {result === 'pass' ? (
                            <CheckCircle2 size={16} color={RESULT_COLORS.pass} />
                          ) : result === 'partial' ? (
                            <div style={{
                              width: 16, height: 16, borderRadius: '50%',
                              background: RESULT_COLORS.partial,
                              display: 'inline-flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '10px', color: '#000'
                            }}>~</div>
                          ) : (
                            <XCircle size={16} color={RESULT_COLORS.fail} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {completedTests === 0 && (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-icon"><FlaskConical size={24} color="var(--text-muted)" /></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Run Benchmark to See Results</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
