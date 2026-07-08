import React, { useState, useEffect } from 'react';
import {
  Rocket, Play, RotateCcw, CheckCircle2, XCircle,
  Clock, GitBranch, Package, Shield, Server,
  Loader2, AlertTriangle, ChevronRight, Globe,
  Container, Database, Zap, RefreshCw
} from 'lucide-react';

const PIPELINE_STAGES = [
  {
    id: 'build',
    name: 'Build & Compile',
    icon: Package,
    color: '#818cf8',
    steps: [
      { name: 'Install dependencies', duration: 3200, status: 'pending' },
      { name: 'Lint & format check', duration: 1500, status: 'pending' },
      { name: 'TypeScript compilation', duration: 2800, status: 'pending' },
      { name: 'Bundle optimization', duration: 4200, status: 'pending' },
    ],
  },
  {
    id: 'test',
    name: 'Test Suite',
    icon: Shield,
    color: '#22d3ee',
    steps: [
      { name: 'Unit tests (127 tests)', duration: 5400, status: 'pending' },
      { name: 'Integration tests (34 tests)', duration: 8200, status: 'pending' },
      { name: 'Agent behavior tests (12 tests)', duration: 6000, status: 'pending' },
      { name: 'Coverage report (87.3%)', duration: 1200, status: 'pending' },
    ],
  },
  {
    id: 'security',
    name: 'Security Scan',
    icon: Shield,
    color: '#34d399',
    steps: [
      { name: 'Dependency audit (npm audit)', duration: 2000, status: 'pending' },
      { name: 'SAST scan (Semgrep)', duration: 4500, status: 'pending' },
      { name: 'Secret detection', duration: 1800, status: 'pending' },
      { name: 'License compliance', duration: 1200, status: 'pending' },
    ],
  },
  {
    id: 'staging',
    name: 'Deploy to Staging',
    icon: Server,
    color: '#fbbf24',
    steps: [
      { name: 'Build Docker image', duration: 6500, status: 'pending' },
      { name: 'Push to Container Registry', duration: 3200, status: 'pending' },
      { name: 'Deploy to Cloud Run (staging)', duration: 4800, status: 'pending' },
      { name: 'Health check verification', duration: 2000, status: 'pending' },
    ],
  },
  {
    id: 'validation',
    name: 'Staging Validation',
    icon: CheckCircle2,
    color: '#a78bfa',
    steps: [
      { name: 'Smoke tests on staging', duration: 3500, status: 'pending' },
      { name: 'Agent orchestration E2E', duration: 7000, status: 'pending' },
      { name: 'Performance benchmark', duration: 5200, status: 'pending' },
      { name: 'Rollback readiness check', duration: 1000, status: 'pending' },
    ],
  },
  {
    id: 'production',
    name: 'Production Deploy',
    icon: Globe,
    color: '#fb7185',
    steps: [
      { name: 'Canary deployment (5% traffic)', duration: 8000, status: 'pending' },
      { name: 'Monitor error rate (2 min)', duration: 5000, status: 'pending' },
      { name: 'Progressive rollout (25% → 50% → 100%)', duration: 10000, status: 'pending' },
      { name: 'Post-deploy verification', duration: 2500, status: 'pending' },
    ],
  },
];

const DEPLOY_HISTORY = [
  { id: 'd1', version: 'v2.1.4', env: 'production', status: 'success', time: '2 hours ago', commit: 'a3f2c91', author: 'Planner Agent' },
  { id: 'd2', version: 'v2.1.3', env: 'production', status: 'success', time: '1 day ago', commit: 'b7e4d12', author: 'Coder Agent' },
  { id: 'd3', version: 'v2.1.2', env: 'staging', status: 'failed', time: '2 days ago', commit: 'c9f1a87', author: 'Deployer Agent' },
  { id: 'd4', version: 'v2.1.1', env: 'production', status: 'success', time: '3 days ago', commit: 'd2e5f03', author: 'Planner Agent' },
  { id: 'd5', version: 'v2.1.0', env: 'production', status: 'rollback', time: '5 days ago', commit: 'e4g6h28', author: 'Monitor Agent' },
];

export default function DeploymentPipeline() {
  const [stages, setStages] = useState(
    PIPELINE_STAGES.map(s => ({ ...s, steps: s.steps.map(st => ({ ...st })) }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentStageIdx, setCurrentStageIdx] = useState(-1);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [speed, setSpeed] = useState(10); // 10x speed

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setElapsedMs(prev => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Pipeline execution
  useEffect(() => {
    if (!isRunning) return;

    const runNext = () => {
      setStages(prev => {
        const next = prev.map(s => ({ ...s, steps: s.steps.map(st => ({ ...st })) }));

        // Find current running step
        let stageI = currentStageIdx;
        let stepI = currentStepIdx;

        if (stageI === -1) {
          stageI = 0;
          stepI = 0;
        } else {
          // Complete current step
          if (stageI < next.length && stepI < next[stageI].steps.length) {
            next[stageI].steps[stepI].status = 'success';
          }
          // Move to next
          stepI++;
          if (stageI < next.length && stepI >= next[stageI].steps.length) {
            stageI++;
            stepI = 0;
          }
        }

        if (stageI >= next.length) {
          setIsRunning(false);
          setCurrentStageIdx(next.length);
          setCurrentStepIdx(-1);
          return next;
        }

        next[stageI].steps[stepI].status = 'running';
        setCurrentStageIdx(stageI);
        setCurrentStepIdx(stepI);

        return next;
      });
    };

    // Get current step duration
    let delay = 1000;
    if (currentStageIdx >= 0 && currentStageIdx < stages.length) {
      const step = stages[currentStageIdx]?.steps?.[currentStepIdx];
      delay = step ? step.duration / speed : 1000;
    }

    const timeout = setTimeout(runNext, Math.max(200, delay));
    return () => clearTimeout(timeout);
  }, [isRunning, currentStageIdx, currentStepIdx, speed]);

  const reset = () => {
    setStages(PIPELINE_STAGES.map(s => ({ ...s, steps: s.steps.map(st => ({ ...st, status: 'pending' })) })));
    setIsRunning(false);
    setCurrentStageIdx(-1);
    setCurrentStepIdx(-1);
    setElapsedMs(0);
  };

  const getStageStatus = (stage, stageIdx) => {
    if (stageIdx > currentStageIdx) return 'pending';
    if (stageIdx < currentStageIdx) return 'success';
    if (stageIdx === currentStageIdx) {
      if (stage.steps.some(s => s.status === 'running')) return 'running';
      if (stage.steps.every(s => s.status === 'success')) return 'success';
    }
    return 'pending';
  };

  const totalSteps = stages.reduce((s, st) => s + st.steps.length, 0);
  const completedSteps = stages.reduce((s, st) => s + st.steps.filter(step => step.status === 'success').length, 0);
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>
              <Rocket size={22} />
            </div>
            Deployment Pipeline
          </h2>
          <p>CI/CD pipeline visualization for agent system deployments with canary releases</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="select" value={speed} onChange={e => setSpeed(Number(e.target.value))}>
            <option value={5}>5x Speed</option>
            <option value={10}>10x Speed</option>
            <option value={20}>20x Speed</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button
            className={`btn btn-sm ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (currentStageIdx >= stages.length) reset();
              setIsRunning(!isRunning);
            }}
          >
            {isRunning ? <><Loader2 size={14} className="animate-spin-slow" /> Running</> : <><Rocket size={14} /> Deploy</>}
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Pipeline: {completedSteps}/{totalSteps} steps · {(elapsedMs / 1000).toFixed(1)}s elapsed
          </span>
          <span style={{ color: progress >= 100 ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
            {Math.round(progress)}%{progress >= 100 ? ' ✅ Complete' : ''}
          </span>
        </div>
        <div className="progress-bar" style={{ height: '8px' }}>
          <div className="progress-fill" style={{
            width: `${progress}%`,
            background: progress >= 100 ? 'var(--gradient-success)' : 'var(--gradient-primary)',
          }} />
        </div>
      </div>

      {/* Pipeline Stages - Horizontal */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.25rem',
        overflowX: 'auto', padding: '0.25rem'
      }}>
        {stages.map((stage, stageIdx) => {
          const status = getStageStatus(stage, stageIdx);
          const Icon = stage.icon;
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                padding: '0.6rem 1rem', borderRadius: 'var(--radius-lg)',
                background: status === 'running' ? `${stage.color}15` :
                  status === 'success' ? 'rgba(52,211,153,0.08)' : 'var(--bg-card)',
                border: `1px solid ${
                  status === 'running' ? stage.color :
                  status === 'success' ? 'rgba(52,211,153,0.3)' : 'var(--border-color)'
                }`,
                minWidth: '140px', textAlign: 'center',
                transition: 'all 0.3s',
                boxShadow: status === 'running' ? `0 0 15px ${stage.color}20` : 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  {status === 'running' ? (
                    <Loader2 size={14} color={stage.color} className="animate-spin-slow" />
                  ) : status === 'success' ? (
                    <CheckCircle2 size={14} color="#34d399" />
                  ) : (
                    <Icon size={14} color="var(--text-muted)" />
                  )}
                  <span style={{
                    fontSize: '0.72rem', fontWeight: 600,
                    color: status === 'running' ? stage.color :
                      status === 'success' ? '#34d399' : 'var(--text-secondary)'
                  }}>
                    {stage.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  {stage.steps.filter(s => s.status === 'success').length}/{stage.steps.length} steps
                </div>
              </div>
              {stageIdx < stages.length - 1 && (
                <ChevronRight size={16} color={status === 'success' ? '#34d399' : 'var(--text-muted)'} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem' }}>
        {/* Stage Details */}
        <div className="glow-card" style={{ overflow: 'hidden' }}>
          <div className="card-header">
            <h3><GitBranch size={16} /> Pipeline Steps</h3>
          </div>
          <div className="card-body" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            {stages.map((stage, stageIdx) => {
              const Icon = stage.icon;
              return (
                <div key={stage.id} style={{ marginBottom: '1.25rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    marginBottom: '0.5rem', paddingBottom: '0.4rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: `${stage.color}20`, color: stage.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={14} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{stage.name}</span>
                  </div>
                  {stage.steps.map((step, stepIdx) => (
                    <div key={stepIdx} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.5rem 0.75rem', marginBottom: '0.2rem',
                      borderRadius: 'var(--radius-sm)',
                      background: step.status === 'running' ? `${stage.color}08` : 'transparent',
                    }}>
                      <div style={{ width: 20, textAlign: 'center' }}>
                        {step.status === 'success' ? (
                          <CheckCircle2 size={16} color="#34d399" />
                        ) : step.status === 'running' ? (
                          <Loader2 size={16} color={stage.color} className="animate-spin-slow" />
                        ) : step.status === 'failed' ? (
                          <XCircle size={16} color="#fb7185" />
                        ) : (
                          <div style={{
                            width: 14, height: 14, borderRadius: '50%',
                            border: '2px solid var(--border-color)', margin: '0 auto'
                          }} />
                        )}
                      </div>
                      <span style={{
                        flex: 1, fontSize: '0.8rem',
                        color: step.status === 'success' ? 'var(--text-primary)' :
                          step.status === 'running' ? stage.color : 'var(--text-secondary)',
                        fontWeight: step.status === 'running' ? 600 : 400
                      }}>
                        {step.name}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {step.status === 'success' ? `${(step.duration / 1000).toFixed(1)}s` :
                          step.status === 'running' ? '...' : `~${(step.duration / 1000).toFixed(0)}s`}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Deploy History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Environment Status */}
          <div className="glow-card">
            <div className="card-header">
              <h3><Globe size={16} /> Environments</h3>
            </div>
            <div className="card-body">
              {[
                { name: 'Production', status: 'healthy', version: 'v2.1.4', url: 'agentforge.io', color: '#34d399' },
                { name: 'Staging', status: 'deploying', version: 'v2.1.5', url: 'staging.agentforge.io', color: '#fbbf24' },
                { name: 'Development', status: 'healthy', version: 'v2.2.0-dev', url: 'dev.agentforge.io', color: '#818cf8' },
              ].map(env => (
                <div key={env.name} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem', marginBottom: '0.35rem',
                  borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)'
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: env.color,
                    boxShadow: `0 0 8px ${env.color}50`,
                    animation: env.status === 'deploying' ? 'pulse-dot 1s infinite' : 'none'
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{env.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{env.version} · {env.url}</div>
                  </div>
                  <span className="badge" style={{
                    background: `${env.color}15`, color: env.color, fontSize: '0.6rem'
                  }}>
                    {env.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deploy History */}
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3><Clock size={16} /> Deploy History</h3>
            </div>
            <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {DEPLOY_HISTORY.map(dep => (
                <div key={dep.id} style={{
                  padding: '0.6rem', marginBottom: '0.35rem',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${
                    dep.status === 'success' ? '#34d399' :
                    dep.status === 'failed' ? '#fb7185' : '#fbbf24'
                  }`,
                  background: 'var(--bg-primary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{dep.version}</span>
                    <span className="badge" style={{
                      background: dep.status === 'success' ? 'rgba(52,211,153,0.15)' :
                        dep.status === 'failed' ? 'rgba(251,113,133,0.15)' : 'rgba(251,191,36,0.15)',
                      color: dep.status === 'success' ? '#34d399' :
                        dep.status === 'failed' ? '#fb7185' : '#fbbf24',
                      fontSize: '0.6rem'
                    }}>
                      {dep.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                    <span>{dep.env}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{dep.commit}</span>
                    <span>·</span>
                    <span>{dep.time}</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    by {dep.author}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
