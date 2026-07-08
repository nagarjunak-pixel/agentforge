import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Activity, Users, Zap, Clock, ArrowUp,
  ArrowDown, TrendingUp, Brain, Cpu, MonitorDot,
  CheckCircle2, AlertTriangle, XCircle, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const LIVE_DATA = [
  { time: '00:00', tasks: 12, tokens: 4200, agents: 3, errors: 0 },
  { time: '04:00', tasks: 8, tokens: 2800, agents: 2, errors: 1 },
  { time: '08:00', tasks: 34, tokens: 12400, agents: 6, errors: 2 },
  { time: '12:00', tasks: 67, tokens: 24800, agents: 8, errors: 1 },
  { time: '16:00', tasks: 89, tokens: 31200, agents: 10, errors: 0 },
  { time: '20:00', tasks: 45, tokens: 16800, agents: 7, errors: 3 },
  { time: 'Now', tasks: 52, tokens: 19200, agents: 8, errors: 1 },
];

const RECENT_ACTIVITIES = [
  { type: 'success', agent: 'Planner Alpha', task: 'Decomposed "Build REST API" into 5 subtasks', time: '2m ago' },
  { type: 'success', agent: 'Coder Beta', task: 'Implemented JWT authentication middleware', time: '5m ago' },
  { type: 'warning', agent: 'Researcher Gamma', task: 'Rate limited on search API, retrying in 30s', time: '8m ago' },
  { type: 'success', agent: 'Reviewer Delta', task: 'Approved PR #342 with 2 minor suggestions', time: '12m ago' },
  { type: 'error', agent: 'Agent Epsilon', task: 'Tool call failed: database connection timeout', time: '18m ago' },
  { type: 'success', agent: 'Deployer Zeta', task: 'Deployed v2.1.4 to production (canary 5%)', time: '24m ago' },
  { type: 'info', agent: 'Monitor Eta', task: 'Error rate stable at 0.02% post-deployment', time: '30m ago' },
  { type: 'success', agent: 'Planner Alpha', task: 'Created sprint plan for Q3 features', time: '45m ago' },
];

const AGENT_STATUS = [
  { name: 'Planner Alpha', model: 'gemini-2.5-pro', status: 'active', tasks: 12, tokens: 48200, uptime: '99.8%', color: '#818cf8' },
  { name: 'Coder Beta', model: 'claude-opus-4', status: 'active', tasks: 8, tokens: 124800, uptime: '99.5%', color: '#22d3ee' },
  { name: 'Researcher Gamma', model: 'gemini-2.5-flash', status: 'idle', tasks: 34, tokens: 28600, uptime: '98.2%', color: '#34d399' },
  { name: 'Reviewer Delta', model: 'gemini-2.5-pro', status: 'active', tasks: 22, tokens: 62400, uptime: '99.9%', color: '#fbbf24' },
  { name: 'Agent Epsilon', model: 'gpt-4.1', status: 'error', tasks: 6, tokens: 18200, uptime: '94.1%', color: '#fb7185' },
  { name: 'Deployer Zeta', model: 'gemini-2.5-flash', status: 'active', tasks: 15, tokens: 12800, uptime: '99.7%', color: '#e879f9' },
];

const TYPE_COLORS = {
  success: '#34d399',
  warning: '#fbbf24',
  error: '#fb7185',
  info: '#818cf8',
};

const STATUS_CONFIG = {
  active: { color: '#34d399', label: 'Active' },
  idle: { color: '#fbbf24', label: 'Idle' },
  error: { color: '#fb7185', label: 'Error' },
};

export default function Dashboard() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  const totalTasks = AGENT_STATUS.reduce((s, a) => s + a.tasks, 0);
  const totalTokens = AGENT_STATUS.reduce((s, a) => s + a.tokens, 0);
  const activeAgents = AGENT_STATUS.filter(a => a.status === 'active').length;
  const errorAgents = AGENT_STATUS.filter(a => a.status === 'error').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
              <LayoutDashboard size={22} />
            </div>
            Mission Control
          </h2>
          <p>Real-time overview of your multi-agent system</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)',
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)'
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.5)',
              animation: 'pulse-dot 2s infinite'
            }} />
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>System Healthy</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
            <Activity size={18} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <div className="stat-value">{totalTasks}</div>
            <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
              <ArrowUp size={11} /> 12%
            </span>
          </div>
          <div className="stat-label">Tasks Completed Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>
            <Users size={18} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <div className="stat-value">{activeAgents}/{AGENT_STATUS.length}</div>
            {errorAgents > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                {errorAgents} error
              </span>
            )}
          </div>
          <div className="stat-label">Active Agents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            <Zap size={18} />
          </div>
          <div className="stat-value">{(totalTokens / 1000).toFixed(0)}K</div>
          <div className="stat-label">Tokens Used Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
            <Clock size={18} />
          </div>
          <div className="stat-value">99.4%</div>
          <div className="stat-label">System Uptime</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Activity Chart */}
          <div className="glow-card">
            <div className="card-header">
              <h3><TrendingUp size={16} /> System Activity (24h)</h3>
            </div>
            <div className="card-body" style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={LIVE_DATA}>
                  <defs>
                    <linearGradient id="gradTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradAgents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="#6b6b80" fontSize={11} />
                  <YAxis stroke="#6b6b80" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', fontSize: '0.75rem'
                    }}
                  />
                  <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#818cf8" fill="url(#gradTasks)" strokeWidth={2} />
                  <Area type="monotone" dataKey="agents" name="Active Agents" stroke="#34d399" fill="url(#gradAgents)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Agent Fleet */}
          <div className="glow-card">
            <div className="card-header">
              <h3><Cpu size={16} /> Agent Fleet Status</h3>
              <span className="badge badge-indigo">{AGENT_STATUS.length} agents</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
                {AGENT_STATUS.map(agent => {
                  const statusConf = STATUS_CONFIG[agent.status];
                  return (
                    <div key={agent.name} style={{
                      padding: '0.85rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-primary)',
                      border: `1px solid ${agent.status === 'error' ? 'rgba(251,113,133,0.2)' : 'var(--border-color)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: statusConf.color,
                            boxShadow: `0 0 6px ${statusConf.color}50`,
                            animation: agent.status === 'active' ? 'pulse-dot 2s infinite' : 'none'
                          }} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{agent.name}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        {agent.model}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.68rem' }}>
                        <span style={{ color: agent.color }}>{agent.tasks} tasks</span>
                        <span style={{ color: 'var(--text-muted)' }}>·</span>
                        <span style={{ color: 'var(--text-muted)' }}>{(agent.tokens / 1000).toFixed(1)}K tok</span>
                        <span style={{ color: 'var(--text-muted)' }}>·</span>
                        <span style={{ color: parseFloat(agent.uptime) > 99 ? '#34d399' : '#fbbf24' }}>
                          {agent.uptime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h3><Activity size={16} /> Live Activity Feed</h3>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px rgba(52,211,153,0.5)',
              animation: 'pulse-dot 1.5s infinite'
            }} />
          </div>
          <div className="card-body" style={{ flex: 1, overflowY: 'auto' }}>
            {RECENT_ACTIVITIES.map((activity, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.75rem', padding: '0.65rem 0',
                borderBottom: i < RECENT_ACTIVITIES.length - 1 ? '1px solid var(--border-color)' : 'none',
                animation: i === 0 && tick > 0 ? 'none' : 'none'
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: TYPE_COLORS[activity.type],
                  marginTop: 6, flexShrink: 0
                }} />
                <div>
                  <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, color: TYPE_COLORS[activity.type] }}>
                      {activity.agent}
                    </span>
                    {' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{activity.task}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {activity.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
