import React, { useState, useEffect, useCallback } from 'react';
import {
  Workflow, Activity, BrainCircuit, Radio, MonitorDot,
  Bug, Swords, FlaskConical, Zap, Code, Rocket, DollarSign,
  Search, Command, X, ChevronLeft, ChevronRight, Bell,
  Settings, Keyboard, PanelLeft, LayoutDashboard,
  Network, ShieldCheck, Calendar
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AgentGraphBuilder from './components/AgentGraphBuilder';
import SimulationEngine from './components/SimulationEngine';
import MemoryInspector from './components/MemoryInspector';
import ProtocolPlayground from './components/ProtocolPlayground';
import SwarmMonitor from './components/SwarmMonitor';
import ReasoningDebugger from './components/ReasoningDebugger';
import AgentArena from './components/AgentArena';
import EvalSandbox from './components/EvalSandbox';
import AgentCodeEditor from './components/AgentCodeEditor';
import DeploymentPipeline from './components/DeploymentPipeline';
import CostOptimizer from './components/CostOptimizer';
import KnowledgeGraph from './components/KnowledgeGraph';
import GuardrailsStudio from './components/GuardrailsStudio';
import AgentTimeline from './components/AgentTimeline';

const MODULES = [
  { id: 'dashboard', label: 'Mission Control', icon: LayoutDashboard, color: '#818cf8', shortcut: '`', category: 'Overview' },
  { id: 'graph', label: 'Graph Builder', icon: Workflow, color: '#818cf8', shortcut: '1', category: 'Design' },
  { id: 'code', label: 'Code Editor', icon: Code, color: '#60a5fa', shortcut: '2', category: 'Design' },
  { id: 'simulation', label: 'Simulation', icon: Activity, color: '#22d3ee', shortcut: '3', category: 'Execute' },
  { id: 'memory', label: 'Memory Inspector', icon: BrainCircuit, color: '#a78bfa', shortcut: '4', category: 'Debug' },
  { id: 'protocol', label: 'Protocols', icon: Radio, color: '#34d399', shortcut: '5', category: 'Debug' },
  { id: 'debugger', label: 'Reasoning Debugger', icon: Bug, color: '#fb7185', shortcut: '6', category: 'Debug' },
  { id: 'arena', label: 'Agent Arena', icon: Swords, color: '#e879f9', shortcut: '7', category: 'Execute' },
  { id: 'swarm', label: 'Swarm Monitor', icon: MonitorDot, color: '#fbbf24', shortcut: '8', category: 'Monitor' },
  { id: 'eval', label: 'Eval Sandbox', icon: FlaskConical, color: '#60a5fa', shortcut: '9', category: 'Monitor' },
  { id: 'deploy', label: 'Deploy Pipeline', icon: Rocket, color: '#fb7185', shortcut: '0', category: 'Deploy' },
  { id: 'cost', label: 'Cost Optimizer', icon: DollarSign, color: '#34d399', shortcut: '-', category: 'Monitor' },
  { id: 'knowledge', label: 'Knowledge Graph', icon: Network, color: '#a78bfa', shortcut: '=', category: 'Design' },
  { id: 'guardrails', label: 'Guardrails Studio', icon: ShieldCheck, color: '#34d399', shortcut: '[', category: 'Safety' },
  { id: 'timeline', label: 'Agent Timeline', icon: Calendar, color: '#fbbf24', shortcut: ']', category: 'Monitor' },
];

const CATEGORIES = ['Overview', 'Design', 'Execute', 'Debug', 'Monitor', 'Safety', 'Deploy'];

const NOTIFICATIONS = [
  { id: 1, type: 'success', text: 'Agent Alpha completed task #847', time: '2m ago' },
  { id: 2, type: 'warning', text: 'Memory usage at 78% — consider cleanup', time: '5m ago' },
  { id: 3, type: 'info', text: 'Deployment v2.1.5 promoted to staging', time: '12m ago' },
  { id: 4, type: 'error', text: 'Agent Gamma failed: tool timeout on search()', time: '18m ago' },
];

function App() {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const [cmdSearch, setCmdSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Command palette & keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Cmd+K = command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(prev => !prev);
        setCmdSearch('');
      }
      // Escape = close overlays
      if (e.key === 'Escape') {
        setCmdPaletteOpen(false);
        setShowNotifications(false);
        setShowShortcuts(false);
      }
      // Cmd+B = toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(prev => !prev);
      }
      // Cmd+number = switch module (only when no input focused)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const mod = MODULES.find(m => m.shortcut === e.key);
        if (mod && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setActiveModule(mod.id);
          setCmdPaletteOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredModules = MODULES.filter(m =>
    m.label.toLowerCase().includes(cmdSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(cmdSearch.toLowerCase())
  );

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': return <Dashboard />;
      case 'graph': return <AgentGraphBuilder />;
      case 'code': return <AgentCodeEditor />;
      case 'simulation': return <SimulationEngine />;
      case 'memory': return <MemoryInspector />;
      case 'protocol': return <ProtocolPlayground />;
      case 'swarm': return <SwarmMonitor />;
      case 'debugger': return <ReasoningDebugger />;
      case 'arena': return <AgentArena />;
      case 'eval': return <EvalSandbox />;
      case 'deploy': return <DeploymentPipeline />;
      case 'cost': return <CostOptimizer />;
      case 'knowledge': return <KnowledgeGraph />;
      case 'guardrails': return <GuardrailsStudio />;
      case 'timeline': return <AgentTimeline />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Zap size={20} />
          </div>
          {!sidebarCollapsed ? (
            <div>
              <h1>AgentForge</h1>
              <span className="version-badge">v2.1 PRO</span>
            </div>
          ) : (
            <span className="brand-collapsed-label">AF</span>
          )}
        </div>

        {/* Quick search */}
        {!sidebarCollapsed && (
          <button
            className="cmd-trigger"
            onClick={() => { setCmdPaletteOpen(true); setCmdSearch(''); }}
          >
            <Search size={14} />
            <span>Search modules...</span>
            <kbd>⌘K</kbd>
          </button>
        )}

        <nav className="sidebar-nav">
          {CATEGORIES.map(cat => {
            const catModules = MODULES.filter(m => m.category === cat);
            return (
              <div key={cat}>
                {!sidebarCollapsed && <div className="nav-section-label">{cat}</div>}
                {catModules.map((mod) => {
                  const Icon = mod.icon;
                  return (
                    <button
                      key={mod.id}
                      className={`nav-btn ${activeModule === mod.id ? 'active' : ''}`}
                      onClick={() => setActiveModule(mod.id)}
                      title={sidebarCollapsed ? `${mod.label} (⌘${mod.shortcut})` : undefined}
                    >
                      <div
                        className="nav-icon"
                        style={{
                          color: mod.color,
                          background: activeModule === mod.id
                            ? `${mod.color}20`
                            : 'transparent'
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      {!sidebarCollapsed && (
                        <>
                          {mod.label}
                          <span className="nav-shortcut">⌘{mod.shortcut}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Toggle sidebar (⌘B)"
              style={{ padding: '0.4rem' }}
            >
              <PanelLeft size={16} />
            </button>
            {!sidebarCollapsed && (
              <>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowShortcuts(true)}
                  title="Keyboard shortcuts"
                  style={{ padding: '0.4rem' }}
                >
                  <Keyboard size={16} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                  style={{ padding: '0.4rem', position: 'relative' }}
                >
                  <Bell size={16} />
                  <div style={{
                    position: 'absolute', top: 2, right: 2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#fb7185',
                    boxShadow: '0 0 6px rgba(251,113,133,0.5)'
                  }} />
                </button>
              </>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-status">
              <div className="status-dot" />
              <span>Online — {MODULES.length} Modules</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderModule()}
      </main>

      {/* Command Palette */}
      {cmdPaletteOpen && (
        <div className="modal-overlay" onClick={() => setCmdPaletteOpen(false)}>
          <div className="cmd-palette" onClick={e => e.stopPropagation()}>
            <div className="cmd-palette-input">
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search modules, commands..."
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter' && filteredModules.length > 0) {
                    setActiveModule(filteredModules[0].id);
                    setCmdPaletteOpen(false);
                  }
                }}
              />
              <kbd>ESC</kbd>
            </div>
            <div className="cmd-palette-results">
              {filteredModules.map(mod => {
                const Icon = mod.icon;
                return (
                  <button
                    key={mod.id}
                    className={`cmd-palette-item ${activeModule === mod.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveModule(mod.id);
                      setCmdPaletteOpen(false);
                    }}
                  >
                    <Icon size={18} color={mod.color} />
                    <span className="cmd-item-label">{mod.label}</span>
                    <span className="cmd-item-category">{mod.category}</span>
                    <kbd>⌘{mod.shortcut}</kbd>
                  </button>
                );
              })}
              {filteredModules.length === 0 && (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No modules found for "{cmdSearch}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="notification-panel" style={{ left: sidebarCollapsed ? '80px' : '16px' }}>
          <div className="notification-header">
            <h4>Notifications</h4>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNotifications(false)}>
              <X size={14} />
            </button>
          </div>
          {NOTIFICATIONS.map(n => (
            <div key={n.id} className={`notification-item ${n.type}`}>
              <div className="notification-dot" style={{
                background: n.type === 'success' ? '#34d399' :
                  n.type === 'warning' ? '#fbbf24' :
                  n.type === 'error' ? '#fb7185' : '#818cf8'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.78rem' }}>{n.text}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{n.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="modal-overlay" onClick={() => setShowShortcuts(false)}>
          <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Keyboard size={18} /> Keyboard Shortcuts
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowShortcuts(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div className="shortcut-row"><kbd>⌘K</kbd><span>Command Palette</span></div>
              <div className="shortcut-row"><kbd>⌘B</kbd><span>Toggle Sidebar</span></div>
              {MODULES.map(mod => (
                <div key={mod.id} className="shortcut-row">
                  <kbd>⌘{mod.shortcut}</kbd>
                  <span>{mod.label}</span>
                </div>
              ))}
              <div className="shortcut-row"><kbd>ESC</kbd><span>Close Overlay</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
