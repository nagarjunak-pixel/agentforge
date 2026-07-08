import React, { useState, useEffect, useRef } from 'react';
import {
  Radio, Play, RotateCcw, ChevronRight, Server,
  ArrowRight, ArrowLeftRight, Code, AlertTriangle,
  CheckCircle2, XCircle, Clock, Zap, Send
} from 'lucide-react';

const PROTOCOLS = [
  { id: 'mcp', name: 'MCP (Model Context Protocol)', color: '#818cf8' },
  { id: 'a2a', name: 'A2A (Agent-to-Agent)', color: '#22d3ee' },
  { id: 'tool_use', name: 'Tool Use Protocol', color: '#34d399' },
];

const MCP_SIMULATION = [
  {
    from: 'Client', to: 'Server', type: 'request', protocol: 'MCP',
    method: 'initialize',
    payload: `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {}
    },
    "clientInfo": {
      "name": "AgentForge",
      "version": "2.0.0"
    }
  }
}`,
    description: 'Client initiates MCP handshake with server capabilities',
    latency: 45,
  },
  {
    from: 'Server', to: 'Client', type: 'response', protocol: 'MCP',
    method: 'initialize',
    payload: `{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "tools": { "listChanged": true },
      "resources": { "subscribe": true }
    },
    "serverInfo": {
      "name": "file-system-server",
      "version": "1.2.0"
    }
  }
}`,
    description: 'Server responds with its capabilities and protocol version',
    latency: 32,
  },
  {
    from: 'Client', to: 'Server', type: 'notification', protocol: 'MCP',
    method: 'initialized',
    payload: `{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}`,
    description: 'Client confirms initialization is complete',
    latency: 5,
  },
  {
    from: 'Client', to: 'Server', type: 'request', protocol: 'MCP',
    method: 'tools/list',
    payload: `{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}`,
    description: 'Client requests the list of available tools',
    latency: 28,
  },
  {
    from: 'Server', to: 'Client', type: 'response', protocol: 'MCP',
    method: 'tools/list',
    payload: `{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "read_file",
        "description": "Read contents of a file",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": { "type": "string" }
          },
          "required": ["path"]
        }
      },
      {
        "name": "write_file",
        "description": "Write content to a file",
        "inputSchema": { ... }
      }
    ]
  }
}`,
    description: 'Server returns its registered tool definitions',
    latency: 15,
  },
  {
    from: 'Client', to: 'Server', type: 'request', protocol: 'MCP',
    method: 'tools/call',
    payload: `{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "/src/auth/middleware.ts"
    }
  }
}`,
    description: 'Client invokes the read_file tool with path argument',
    latency: 120,
  },
  {
    from: 'Server', to: 'Client', type: 'response', protocol: 'MCP',
    method: 'tools/call',
    payload: `{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "import { verify } from 'jsonwebtoken';\\n..."
      }
    ],
    "isError": false
  }
}`,
    description: 'Server returns the file content as tool result',
    latency: 85,
  },
];

const A2A_SIMULATION = [
  {
    from: 'Agent A', to: 'Agent B', type: 'request', protocol: 'A2A',
    method: 'tasks/send',
    payload: `{
  "jsonrpc": "2.0",
  "id": "task-001",
  "method": "tasks/send",
  "params": {
    "id": "research-auth",
    "message": {
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "Research best practices for JWT authentication"
      }]
    }
  }
}`,
    description: 'Agent A sends a research task to Agent B',
    latency: 55,
  },
  {
    from: 'Agent B', to: 'Agent A', type: 'response', protocol: 'A2A',
    method: 'tasks/send',
    payload: `{
  "jsonrpc": "2.0",
  "id": "task-001",
  "result": {
    "id": "research-auth",
    "status": {
      "state": "working"
    },
    "artifacts": []
  }
}`,
    description: 'Agent B acknowledges and begins working on the task',
    latency: 40,
  },
  {
    from: 'Agent B', to: 'Agent A', type: 'notification', protocol: 'A2A',
    method: 'tasks/pushNotification',
    payload: `{
  "jsonrpc": "2.0",
  "method": "tasks/pushNotification",
  "params": {
    "id": "research-auth",
    "status": { "state": "completed" },
    "artifacts": [{
      "name": "auth_research",
      "parts": [{
        "type": "text",
        "text": "Recommendation: JWT RS256 with refresh token rotation..."
      }]
    }]
  }
}`,
    description: 'Agent B completes research and pushes results with artifacts',
    latency: 2800,
  },
];

const TOOL_SIMULATION = [
  {
    from: 'LLM', to: 'Runtime', type: 'request', protocol: 'Tool Use',
    method: 'function_call',
    payload: `{
  "function_call": {
    "name": "search_codebase",
    "arguments": {
      "query": "authentication middleware",
      "file_patterns": ["*.ts", "*.js"],
      "max_results": 5
    }
  }
}`,
    description: 'LLM decides to call search_codebase tool',
    latency: 0,
  },
  {
    from: 'Runtime', to: 'Tool', type: 'request', protocol: 'Tool Use',
    method: 'execute',
    payload: `Executing: search_codebase({
  query: "authentication middleware",
  file_patterns: ["*.ts", "*.js"],
  max_results: 5
})`,
    description: 'Runtime dispatches the function call to the tool implementation',
    latency: 350,
  },
  {
    from: 'Tool', to: 'Runtime', type: 'response', protocol: 'Tool Use',
    method: 'result',
    payload: `{
  "results": [
    { "file": "src/middleware/auth.ts", "line": 12, "match": "export const verifyToken" },
    { "file": "src/routes/protected.ts", "line": 5, "match": "router.use(authMiddleware)" }
  ],
  "total_matches": 2
}`,
    description: 'Tool returns search results to runtime',
    latency: 180,
  },
  {
    from: 'Runtime', to: 'LLM', type: 'response', protocol: 'Tool Use',
    method: 'function_response',
    payload: `{
  "function_response": {
    "name": "search_codebase",
    "response": {
      "results": [...],
      "total_matches": 2
    }
  }
}`,
    description: 'Runtime forwards results back to LLM as function response',
    latency: 10,
  },
];

const PROTOCOL_DATA = {
  mcp: MCP_SIMULATION,
  a2a: A2A_SIMULATION,
  tool_use: TOOL_SIMULATION,
};

export default function ProtocolPlayground() {
  const [activeProtocol, setActiveProtocol] = useState('mcp');
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [speed, setSpeed] = useState(1);
  const scrollRef = useRef(null);

  const messages = PROTOCOL_DATA[activeProtocol];
  const protocol = PROTOCOLS.find(p => p.id === activeProtocol);

  useEffect(() => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setSelectedMessage(null);
  }, [activeProtocol]);

  useEffect(() => {
    if (!isPlaying || currentStep >= messages.length - 1) {
      if (currentStep >= messages.length - 1) setIsPlaying(false);
      return;
    }
    const msg = messages[currentStep >= 0 ? currentStep : 0];
    const delay = Math.max(300, (msg?.latency || 500)) / speed + 400;
    const timeout = setTimeout(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next < messages.length) {
          setSelectedMessage(messages[next]);
        }
        return next;
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [isPlaying, currentStep, speed, messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep >= messages.length - 1) return;
    const next = currentStep + 1;
    setCurrentStep(next);
    setSelectedMessage(messages[next]);
  };

  const reset = () => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setSelectedMessage(null);
  };

  const getTypeStyle = (type) => {
    switch (type) {
      case 'request': return { bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.3)', color: '#818cf8' };
      case 'response': return { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)', color: '#34d399' };
      case 'notification': return { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' };
      default: return { bg: 'var(--bg-card)', border: 'var(--border-color)', color: 'var(--text-primary)' };
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
              <Radio size={22} />
            </div>
            Protocol Playground
          </h2>
          <p>Interactive MCP, A2A, and Tool Use protocol simulator with packet visualization</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select className="select" value={speed} onChange={e => setSpeed(Number(e.target.value))}>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={reset}>
            <RotateCcw size={14} /> Reset
          </button>
          <button
            className={`btn btn-sm ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (currentStep >= messages.length - 1) reset();
              setIsPlaying(!isPlaying);
            }}
          >
            <Play size={14} /> {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={nextStep} disabled={currentStep >= messages.length - 1}>
            <ChevronRight size={14} /> Step
          </button>
        </div>
      </div>

      {/* Protocol Tabs */}
      <div className="tabs" style={{ marginBottom: '1.25rem', width: 'fit-content' }}>
        {PROTOCOLS.map(p => (
          <button
            key={p.id}
            className={`tab-btn ${activeProtocol === p.id ? 'active' : ''}`}
            onClick={() => setActiveProtocol(p.id)}
            style={activeProtocol === p.id ? { background: p.color } : {}}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid-sidebar">
        {/* Sequence Diagram */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h3><ArrowLeftRight size={16} /> Message Sequence</h3>
            <span className="badge" style={{ background: `${protocol.color}20`, color: protocol.color }}>
              {currentStep + 1} / {messages.length}
            </span>
          </div>
          <div ref={scrollRef} className="card-body" style={{ flex: 1, overflowY: 'auto' }}>
            {/* Participants Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem',
              padding: '0 2rem'
            }}>
              {[...new Set(messages.flatMap(m => [m.from, m.to]))].map((participant, i) => (
                <div key={participant} style={{
                  textAlign: 'center', padding: '0.5rem 1rem',
                  background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', minWidth: '100px'
                }}>
                  <Server size={16} style={{ margin: '0 auto 0.25rem', display: 'block', color: protocol.color }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>{participant}</div>
                </div>
              ))}
            </div>

            {/* Messages */}
            {messages.slice(0, currentStep + 1).map((msg, i) => {
              const style = getTypeStyle(msg.type);
              const isLast = i === currentStep;
              const isFromLeft = msg.from === messages[0].from;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedMessage(msg)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    marginBottom: '1rem', animation: isLast ? 'slide-up 0.3s ease-out' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    width: '100%', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '60px', textAlign: 'right' }}>
                      {msg.from}
                    </span>
                    <div style={{
                      flex: 1, maxWidth: '300px', height: '2px',
                      background: `linear-gradient(${isFromLeft ? 'to right' : 'to left'}, ${style.color}, transparent)`,
                      position: 'relative'
                    }}>
                      <ArrowRight
                        size={14}
                        style={{
                          position: 'absolute',
                          right: isFromLeft ? 0 : 'auto',
                          left: isFromLeft ? 'auto' : 0,
                          top: '-6px',
                          color: style.color,
                          transform: isFromLeft ? 'none' : 'rotate(180deg)'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: '60px' }}>
                      {msg.to}
                    </span>
                  </div>
                  <div style={{
                    background: style.bg, border: `1px solid ${style.border}`,
                    borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem',
                    marginTop: '0.25rem', maxWidth: '80%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                      <span className="badge" style={{ background: `${style.color}20`, color: style.color, fontSize: '0.6rem' }}>
                        {msg.type.toUpperCase()}
                      </span>
                      <code style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: style.color, fontWeight: 600 }}>
                        {msg.method}
                      </code>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {msg.latency}ms
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {msg.description}
                    </div>
                  </div>
                </div>
              );
            })}

            {currentStep < 0 && (
              <div className="empty-state">
                <div className="empty-icon"><Radio size={24} color="var(--text-muted)" /></div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Ready to Simulate</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Press Play or Step to see {protocol.name} messages
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payload Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'auto' }}>
          <div className="glow-card" style={{ flex: 1 }}>
            <div className="card-header">
              <h3><Code size={16} /> Payload Inspector</h3>
            </div>
            <div className="card-body">
              {selectedMessage ? (
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <span className="badge" style={{
                      background: `${getTypeStyle(selectedMessage.type).color}20`,
                      color: getTypeStyle(selectedMessage.type).color
                    }}>
                      {selectedMessage.type}
                    </span>
                    <span className="badge badge-indigo">{selectedMessage.protocol}</span>
                    <span className="badge badge-cyan">{selectedMessage.latency}ms</span>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Method</div>
                    <code style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: protocol.color, fontWeight: 600 }}>
                      {selectedMessage.method}
                    </code>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Flow</div>
                    <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600 }}>{selectedMessage.from}</span>
                      <ArrowRight size={14} color="var(--text-muted)" />
                      <span style={{ fontWeight: 600 }}>{selectedMessage.to}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Payload</div>
                    <div className="code-block">
                      <div className="code-header">
                        <span>JSON-RPC 2.0</span>
                      </div>
                      <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--accent-cyan)', fontSize: '0.72rem' }}>
                        {selectedMessage.payload}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-icon"><Code size={24} color="var(--text-muted)" /></div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>No Message Selected</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Click a message to inspect its payload
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
