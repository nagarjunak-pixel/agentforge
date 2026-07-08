import React, { useState } from 'react';
import {
  DollarSign, TrendingDown, TrendingUp, Zap, BarChart3,
  ArrowDown, ArrowUp, Lightbulb, AlertTriangle, Clock,
  Brain, Cpu, Layers, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  Legend
} from 'recharts';

const COST_DATA_7D = [
  { day: 'Mon', input: 12.40, output: 8.20, cached: 3.10, total: 23.70 },
  { day: 'Tue', input: 15.80, output: 10.50, cached: 4.20, total: 30.50 },
  { day: 'Wed', input: 18.90, output: 12.10, cached: 5.80, total: 36.80 },
  { day: 'Thu', input: 14.20, output: 9.80, cached: 6.40, total: 30.40 },
  { day: 'Fri', input: 22.50, output: 14.30, cached: 7.10, total: 43.90 },
  { day: 'Sat', input: 9.80, output: 6.40, cached: 3.90, total: 20.10 },
  { day: 'Sun', input: 8.20, output: 5.20, cached: 2.80, total: 16.20 },
];

const MODEL_COSTS = [
  { model: 'gemini-2.5-pro', calls: 12480, tokens: 2840000, cost: 85.20, color: '#818cf8' },
  { model: 'gemini-2.5-flash', calls: 34200, tokens: 1520000, cost: 22.80, color: '#22d3ee' },
  { model: 'claude-opus-4', calls: 3200, tokens: 1180000, cost: 59.00, color: '#e879f9' },
  { model: 'gpt-4.1', calls: 5600, tokens: 980000, cost: 34.30, color: '#fbbf24' },
];

const PIE_DATA = [
  { name: 'Agent Reasoning', value: 42, color: '#818cf8' },
  { name: 'Tool Calls', value: 18, color: '#22d3ee' },
  { name: 'Code Generation', value: 25, color: '#34d399' },
  { name: 'Embeddings', value: 8, color: '#fbbf24' },
  { name: 'Other', value: 7, color: '#6b6b80' },
];

const OPTIMIZATIONS = [
  {
    id: 1,
    title: 'Enable prompt caching for repeated system prompts',
    category: 'caching',
    impact: 'high',
    savings: '$42.30/week',
    reduction: '21%',
    effort: 'Low',
    description: 'Your agents send identical system prompts on 78% of calls. Enable context caching to reuse prefilled KV-cache.',
    applied: false,
  },
  {
    id: 2,
    title: 'Route simple tasks to Flash instead of Pro',
    category: 'routing',
    impact: 'high',
    savings: '$38.50/week',
    reduction: '19%',
    effort: 'Medium',
    description: 'Analysis shows 45% of tasks sent to gemini-2.5-pro are classification/extraction tasks that Flash handles equally well at 1/10 the cost.',
    applied: false,
  },
  {
    id: 3,
    title: 'Reduce context window with sliding window + summarization',
    category: 'context',
    impact: 'medium',
    savings: '$18.70/week',
    reduction: '9%',
    effort: 'Medium',
    description: 'Average context length is 32K tokens but effective context usage is only 8K. Use progressive summarization to compress older messages.',
    applied: false,
  },
  {
    id: 4,
    title: 'Batch embedding calls instead of single-request',
    category: 'batching',
    impact: 'medium',
    savings: '$12.40/week',
    reduction: '6%',
    effort: 'Low',
    description: 'Current embedding pipeline makes 340 individual API calls/hour. Batching into groups of 100 reduces overhead by 85%.',
    applied: false,
  },
  {
    id: 5,
    title: 'Implement response streaming with early termination',
    category: 'efficiency',
    impact: 'low',
    savings: '$8.20/week',
    reduction: '4%',
    effort: 'Low',
    description: 'Enable streaming and cancel generation when the agent has enough information to proceed, saving output tokens.',
    applied: false,
  },
  {
    id: 6,
    title: 'Use structured output mode to reduce retries',
    category: 'reliability',
    impact: 'medium',
    savings: '$15.60/week',
    reduction: '8%',
    effort: 'Low',
    description: 'Currently 12% of calls fail JSON parsing and retry. Using structured output (responseSchema) reduces retries to near zero.',
    applied: false,
  },
];

const IMPACT_COLORS = { high: '#fb7185', medium: '#fbbf24', low: '#34d399' };
const CATEGORY_ICONS = {
  caching: Layers,
  routing: Cpu,
  context: Brain,
  batching: BarChart3,
  efficiency: Zap,
  reliability: CheckCircle2,
};

export default function CostOptimizer() {
  const [optimizations, setOptimizations] = useState(OPTIMIZATIONS);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleOptimization = (id) => {
    setOptimizations(prev => prev.map(o => o.id === id ? { ...o, applied: !o.applied } : o));
  };

  const totalWeeklyCost = COST_DATA_7D.reduce((s, d) => s + d.total, 0);
  const appliedSavings = optimizations
    .filter(o => o.applied)
    .reduce((s, o) => s + parseFloat(o.savings.replace('$', '').replace('/week', '')), 0);
  const optimizedCost = totalWeeklyCost - appliedSavings;
  const savingsPercent = totalWeeklyCost > 0 ? (appliedSavings / totalWeeklyCost * 100) : 0;

  const totalTokens = MODEL_COSTS.reduce((s, m) => s + m.tokens, 0);
  const totalCalls = MODEL_COSTS.reduce((s, m) => s + m.calls, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
              <DollarSign size={22} />
            </div>
            Cost Optimizer
          </h2>
          <p>Analyze token spending, identify optimizations, and reduce agent operating costs</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}><DollarSign size={18} /></div>
          <div className="stat-value">${totalWeeklyCost.toFixed(2)}</div>
          <div className="stat-label">Weekly Spend</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}><TrendingDown size={18} /></div>
          <div className="stat-value" style={{ color: appliedSavings > 0 ? '#34d399' : 'var(--text-primary)' }}>
            -${appliedSavings.toFixed(2)}
          </div>
          <div className="stat-label">Potential Savings</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}><Zap size={18} /></div>
          <div className="stat-value">{(totalTokens / 1000000).toFixed(1)}M</div>
          <div className="stat-label">Tokens This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(232,121,249,0.15)', color: '#e879f9' }}><Clock size={18} /></div>
          <div className="stat-value">{totalCalls.toLocaleString()}</div>
          <div className="stat-label">API Calls</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem', width: 'fit-content' }}>
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Spending Overview
        </button>
        <button className={`tab-btn ${activeTab === 'optimize' ? 'active' : ''}`} onClick={() => setActiveTab('optimize')}>
          Optimizations ({optimizations.filter(o => !o.applied).length})
        </button>
        <button className={`tab-btn ${activeTab === 'models' ? 'active' : ''}`} onClick={() => setActiveTab('models')}>
          Model Breakdown
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid-2">
          {/* Cost Over Time */}
          <div className="glow-card">
            <div className="card-header">
              <h3><TrendingUp size={16} /> Daily Spending (7 days)</h3>
            </div>
            <div className="card-body" style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={COST_DATA_7D}>
                  <defs>
                    <linearGradient id="gradInput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCached" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#6b6b80" fontSize={11} />
                  <YAxis stroke="#6b6b80" fontSize={11} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', fontSize: '0.75rem'
                    }}
                    formatter={(v) => [`$${v.toFixed(2)}`]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="input" name="Input Tokens" stroke="#818cf8" fill="url(#gradInput)" strokeWidth={2} />
                  <Area type="monotone" dataKey="output" name="Output Tokens" stroke="#22d3ee" fill="url(#gradOutput)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cached" name="Cached" stroke="#34d399" fill="url(#gradCached)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost by Category */}
          <div className="glow-card">
            <div className="card-header">
              <h3><BarChart3 size={16} /> Cost by Category</h3>
            </div>
            <div className="card-body" style={{ height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {PIE_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                      borderRadius: '8px', fontSize: '0.75rem'
                    }}
                    formatter={(v) => [`${v}%`]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'optimize' && (
        <div>
          {/* Savings Summary */}
          {appliedSavings > 0 && (
            <div className="glow-card" style={{ marginBottom: '1rem', borderColor: 'rgba(52,211,153,0.3)' }}>
              <div className="card-body" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(52,211,153,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <TrendingDown size={22} color="#34d399" />
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                      ${appliedSavings.toFixed(2)}/week saved
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {savingsPercent.toFixed(1)}% cost reduction · Optimized cost: ${optimizedCost.toFixed(2)}/week
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '2rem', fontWeight: 800, color: '#34d399',
                  fontFamily: 'var(--font-mono)'
                }}>
                  -{savingsPercent.toFixed(0)}%
                </div>
              </div>
            </div>
          )}

          {/* Optimization Cards */}
          {optimizations.map(opt => {
            const CatIcon = CATEGORY_ICONS[opt.category] || Lightbulb;
            return (
              <div key={opt.id} className="glow-card" style={{
                marginBottom: '0.75rem',
                opacity: opt.applied ? 0.6 : 1,
                borderColor: opt.applied ? 'rgba(52,211,153,0.3)' : 'var(--border-color)'
              }}>
                <div className="card-body" style={{
                  padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem'
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: `${IMPACT_COLORS[opt.impact]}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <CatIcon size={20} color={IMPACT_COLORS[opt.impact]} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, textDecoration: opt.applied ? 'line-through' : 'none' }}>
                        {opt.title}
                      </span>
                      <span className="badge" style={{
                        background: `${IMPACT_COLORS[opt.impact]}15`,
                        color: IMPACT_COLORS[opt.impact],
                        fontSize: '0.6rem'
                      }}>
                        {opt.impact} impact
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {opt.description}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem' }}>
                      <span style={{ color: '#34d399', fontWeight: 600 }}>
                        <ArrowDown size={12} style={{ verticalAlign: 'middle' }} /> {opt.savings}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        ~{opt.reduction} reduction
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Effort: {opt.effort}
                      </span>
                    </div>
                  </div>
                  <button
                    className={`btn btn-sm ${opt.applied ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => toggleOptimization(opt.id)}
                  >
                    {opt.applied ? <><CheckCircle2 size={14} /> Applied</> : 'Apply'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'models' && (
        <div className="glow-card">
          <div className="card-header">
            <h3><Cpu size={16} /> Model Cost Breakdown</h3>
          </div>
          <div className="card-body">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.7rem', textAlign: 'left', color: 'var(--text-muted)' }}>Model</th>
                  <th style={{ padding: '0.7rem', textAlign: 'right', color: 'var(--text-muted)' }}>API Calls</th>
                  <th style={{ padding: '0.7rem', textAlign: 'right', color: 'var(--text-muted)' }}>Tokens</th>
                  <th style={{ padding: '0.7rem', textAlign: 'right', color: 'var(--text-muted)' }}>Cost</th>
                  <th style={{ padding: '0.7rem', textAlign: 'right', color: 'var(--text-muted)' }}>$/1K tokens</th>
                  <th style={{ padding: '0.7rem', textAlign: 'left', color: 'var(--text-muted)', width: '30%' }}>Distribution</th>
                </tr>
              </thead>
              <tbody>
                {MODEL_COSTS.map(model => {
                  const totalCost = MODEL_COSTS.reduce((s, m) => s + m.cost, 0);
                  const costPct = (model.cost / totalCost) * 100;
                  return (
                    <tr key={model.model} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.7rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: 3, background: model.color }} />
                          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                            {model.model}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.7rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {model.calls.toLocaleString()}
                      </td>
                      <td style={{ padding: '0.7rem', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {(model.tokens / 1000000).toFixed(2)}M
                      </td>
                      <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: 700, color: model.color }}>
                        ${model.cost.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.7rem', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        ${(model.cost / (model.tokens / 1000)).toFixed(4)}
                      </td>
                      <td style={{ padding: '0.7rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-bar" style={{ flex: 1, height: '6px' }}>
                            <div className="progress-fill" style={{ width: `${costPct}%`, background: model.color }} />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '32px' }}>
                            {costPct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
