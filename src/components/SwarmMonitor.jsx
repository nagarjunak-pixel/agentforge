import React, { useState, useEffect } from 'react';
import {
  MonitorDot, Activity, Zap, Clock, DollarSign,
  Cpu, AlertTriangle, CheckCircle2, RefreshCw,
  TrendingUp, BarChart3, Gauge
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

const AGENTS = [
  { id: 'a1', name: 'Planner', model: 'gemini-2.5-pro', status: 'active', tasks: 12, tokens: 24500, latency: 320, errors: 0, color: '#818cf8' },
  { id: 'a2', name: 'Researcher', model: 'gemini-2.5-flash', status: 'active', tasks: 28, tokens: 45200, latency: 180, errors: 1, color: '#22d3ee' },
  { id: 'a3', name: 'Coder', model: 'claude-opus-4', status: 'active', tasks: 8, tokens: 89000, latency: 850, errors: 2, color: '#34d399' },
  { id: 'a4', name: 'Reviewer', model: 'gemini-2.5-pro', status: 'idle', tasks: 6, tokens: 18300, latency: 420, errors: 0, color: '#fbbf24' },
  { id: 'a5', name: 'Tester', model: 'gemini-2.5-flash', status: 'active', tasks: 15, tokens: 31000, latency: 240, errors: 0, color: '#fb7185' },
  { id: 'a6', name: 'Deployer', model: 'gemini-2.5-flash', status: 'idle', tasks: 3, tokens: 8900, latency: 150, errors: 0, color: '#a78bfa' },
  { id: 'a7', name: 'Monitor', model: 'gemini-2.5-flash', status: 'active', tasks: 45, tokens: 12000, latency: 90, errors: 0, color: '#e879f9' },
  { id: 'a8', name: 'Optimizer', model: 'gemini-2.5-pro', status: 'error', tasks: 2, tokens: 5200, latency: 0, errors: 5, color: '#60a5fa' },
];

const generateTimeData = () => {
  const data = [];
  for (let i = 0; i < 30; i++) {
    data.push({
      time: `${i}s`,
      throughput: Math.floor(Math.random() * 50) + 30,
      latency: Math.floor(Math.random() * 300) + 100,
      tokens: Math.floor(Math.random() * 2000) + 500,
      cost: (Math.random() * 0.05 + 0.01).toFixed(4),
      errors: Math.random() > 0.85 ? 1 : 0,
    });
  }
  return data;
};

const TASK_QUEUE = [
  { id: 't1', task: 'Implement user auth endpoint', agent: 'Coder', priority: 'high', status: 'running', progress: 72 },
  { id: 't2', task: 'Research OAuth2 providers', agent: 'Researcher', priority: 'medium', status: 'running', progress: 45 },
  { id: 't3', task: 'Write integration tests', agent: 'Tester', priority: 'medium', status: 'running', progress: 88 },
  { id: 't4', task: 'Review PR #42', agent: 'Reviewer', priority: 'low', status: 'queued', progress: 0 },
  { id: 't5', task: 'Deploy to staging', agent: 'Deployer', priority: 'high', status: 'queued', progress: 0 },
  { id: 't6', task: 'Performance profiling', agent: 'Monitor', priority: 'low', status: 'running', progress: 60 },
];

const PRIORITY_COLORS = { high: '#fb7185', medium: '#fbbf24', low: '#34d399' };
const STATUS_COLORS = { running: '#818cf8', queued: '#6b6b80', completed: '#34d399', failed: '#fb7185' };

export default function SwarmMonitor() {
  const [timeData, setTimeData] = useState(generateTimeData);
  const [agents, setAgents] = useState(AGENTS);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Simulate live data
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeData(prev => {
        const newData = [...prev.slice(1), {
          time: `${parseInt(prev[prev.length - 1].time) + 1}s`,
          throughput: Math.floor(Math.random() * 50) + 30,
          latency: Math.floor(Math.random() * 300) + 100,
          tokens: Math.floor(Math.random() * 2000) + 500,
          cost: (Math.random() * 0.05 + 0.01).toFixed(4),
          errors: Math.random() > 0.85 ? 1 : 0,
        }];
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalTokens = agents.reduce((s, a) => s + a.tokens, 0);
  const totalTasks = agents.reduce((s, a) => s + a.tasks, 0);
  const activeCount = agents.filter(a => a.status === 'active').length;
  const errorCount = agents.filter(a => a.status === 'error').length;
  const avgLatency = Math.round(agents.filter(a => a.latency > 0).reduce((s, a) => s + a.latency, 0) / agents.filter(a => a.latency > 0).length);

  const pieData = agents.map(a => ({ name: a.name, value: a.tokens, color: a.color }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              <MonitorDot size={22} />
            </div>
            Agent Swarm Monitor
          </h2>
          <p>Real-time dashboard for agent health, throughput, token usage, and task management</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="status-dot" style={{ width: 8, height: 8 }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)' }}>Live</span>
        </div>
      </div>

      {/* Top Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}><Cpu size={18} /></div>
          <div className="stat-value">{activeCount}/{agents.length}</div>
          <div className="stat-label">Agents Active</div>
          {errorCount > 0 && <div className="stat-change negative"><AlertTriangle size={10} /> {errorCount} errors</div>}
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}><Zap size={18} /></div>
          <div className="stat-value">{(totalTokens / 1000).toFixed(0)}K</div>
          <div className="stat-label">Total Tokens</div>
          <div className="stat-change positive"><TrendingUp size={10} /> +12.5%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}><Activity size={18} /></div>
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}><Clock size={18} /></div>
          <div className="stat-value">{avgLatency}ms</div>
          <div className="stat-label">Avg Latency</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232,121,249,0.15)', color: '#e879f9' }}><DollarSign size={18} /></div>
          <div className="stat-value">${(totalTokens / 1000 * 0.003).toFixed(2)}</div>
          <div className="stat-label">Total Cost</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
        {/* Throughput Chart */}
        <div className="glow-card">
          <div className="card-header">
            <h3><TrendingUp size={16} /> Throughput & Latency</h3>
            <span className="badge badge-cyan">Live</span>
          </div>
          <div className="card-body" style={{ height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="throughput" stroke="#818cf8" fill="rgba(129,140,248,0.15)" strokeWidth={2} name="Throughput" />
                <Area type="monotone" dataKey="latency" stroke="#22d3ee" fill="rgba(34,211,238,0.08)" strokeWidth={2} name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Token Usage Pie */}
        <div className="glow-card">
          <div className="card-header">
            <h3><BarChart3 size={16} /> Token Distribution</h3>
          </div>
          <div className="card-body" style={{ height: '220px', display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', fontSize: '0.72rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{(d.value / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Agent Health Grid */}
        <div className="glow-card">
          <div className="card-header">
            <h3><Gauge size={16} /> Agent Health</h3>
          </div>
          <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {agents.map(agent => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.7rem', borderRadius: 'var(--radius-md)',
                  background: selectedAgent?.id === agent.id ? `${agent.color}10` : 'transparent',
                  cursor: 'pointer', marginBottom: '0.35rem', transition: 'background 0.15s'
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${agent.color}20`, color: agent.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Cpu size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {agent.name}
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: agent.status === 'active' ? '#34d399' :
                        agent.status === 'error' ? '#fb7185' : '#6b6b80',
                      display: 'inline-block',
                      boxShadow: agent.status === 'active' ? '0 0 8px rgba(52,211,153,0.5)' : 'none',
                      animation: agent.status === 'active' ? 'pulse-dot 2s infinite' : 'none'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{agent.model}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{agent.tasks} tasks</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{agent.latency}ms avg</div>
                </div>
                {agent.errors > 0 && (
                  <div className="badge badge-rose" style={{ fontSize: '0.6rem' }}>
                    {agent.errors} err
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Task Queue */}
        <div className="glow-card">
          <div className="card-header">
            <h3><Activity size={16} /> Task Queue</h3>
            <span className="badge badge-indigo">{TASK_QUEUE.length} tasks</span>
          </div>
          <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {TASK_QUEUE.map(task => (
              <div key={task.id} style={{
                padding: '0.7rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', marginBottom: '0.5rem',
                background: 'var(--bg-primary)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{task.task}</div>
                  <span className="badge" style={{
                    background: `${PRIORITY_COLORS[task.priority]}15`,
                    color: PRIORITY_COLORS[task.priority],
                    fontSize: '0.6rem'
                  }}>
                    {task.priority}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>→ {task.agent}</span>
                  <span className="badge" style={{
                    background: `${STATUS_COLORS[task.status]}15`,
                    color: STATUS_COLORS[task.status],
                    fontSize: '0.6rem'
                  }}>
                    {task.status}
                  </span>
                </div>
                {task.status === 'running' && (
                  <div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${task.progress}%`,
                        background: 'var(--gradient-primary)'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', textAlign: 'right' }}>
                      {task.progress}%
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
