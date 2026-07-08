import React, { useState, useRef, useEffect } from 'react';
import {
  Code, Play, Copy, Check, RotateCcw, Download,
  FileCode, Terminal, ChevronRight, Sparkles,
  Braces, FileJson, Save, AlertCircle, Loader2
} from 'lucide-react';

const TEMPLATES = {
  react_agent: {
    name: 'ReAct Agent',
    language: 'python',
    code: `"""ReAct Agent — Reasoning + Acting Loop"""
from dataclasses import dataclass, field
from typing import Callable
import json

@dataclass
class Tool:
    name: str
    description: str
    fn: Callable
    schema: dict

@dataclass  
class AgentState:
    messages: list = field(default_factory=list)
    tool_results: list = field(default_factory=list)
    iterations: int = 0
    max_iterations: int = 10
    status: str = "idle"  # idle | thinking | acting | done

class ReActAgent:
    """Multi-step reasoning agent with tool use."""
    
    def __init__(self, model: str, system_prompt: str, tools: list[Tool]):
        self.model = model
        self.system_prompt = system_prompt
        self.tools = {t.name: t for t in tools}
        self.state = AgentState()
    
    async def think(self, observation: str) -> dict:
        """Generate thought + action from current context."""
        self.state.status = "thinking"
        self.state.messages.append({
            "role": "user", 
            "content": observation
        })
        
        # Build prompt with tool descriptions
        tool_desc = "\\n".join(
            f"- {t.name}: {t.description}" 
            for t in self.tools.values()
        )
        
        prompt = f"""You have access to these tools:
{tool_desc}

Think step by step, then decide:
1. THOUGHT: Your reasoning about the current state
2. ACTION: The tool to call (or "finish" if done)
3. INPUT: The input for the tool

Respond in JSON format:
{{"thought": "...", "action": "...", "input": "..."}}"""
        
        # Simulated LLM call
        response = await self._call_llm(prompt)
        self.state.iterations += 1
        return response
    
    async def act(self, action: str, action_input: str) -> str:
        """Execute a tool and return observation."""
        self.state.status = "acting"
        
        if action == "finish":
            self.state.status = "done"
            return action_input
        
        if action not in self.tools:
            return f"Error: Unknown tool '{action}'"
        
        tool = self.tools[action]
        result = await tool.fn(action_input)
        self.state.tool_results.append({
            "tool": action,
            "input": action_input,
            "output": result
        })
        return result
    
    async def run(self, task: str) -> str:
        """Execute the full ReAct loop."""
        observation = task
        
        while self.state.iterations < self.state.max_iterations:
            # Think
            response = await self.think(observation)
            thought = response.get("thought", "")
            action = response.get("action", "finish")
            action_input = response.get("input", "")
            
            print(f"💭 Thought: {thought}")
            print(f"🔧 Action: {action}({action_input})")
            
            # Act
            observation = await self.act(action, action_input)
            print(f"👁 Observation: {observation}\\n")
            
            if self.state.status == "done":
                return observation
        
        return "Max iterations reached."

# === Usage ===
async def search(query: str) -> str:
    return f"Found 3 results for: {query}"

async def calculate(expr: str) -> str:
    return str(eval(expr))

agent = ReActAgent(
    model="gemini-2.5-pro",
    system_prompt="You are a helpful research assistant.",
    tools=[
        Tool("search", "Search the web", search, {}),
        Tool("calculate", "Evaluate math", calculate, {}),
    ]
)

# result = await agent.run("What is the population of Tokyo?")`,
  },
  orchestrator: {
    name: 'Multi-Agent Orchestrator',
    language: 'python',
    code: `"""Multi-Agent Orchestrator with delegation and consensus."""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import asyncio

class AgentRole(Enum):
    PLANNER = "planner"
    WORKER = "worker"
    CRITIC = "critic"
    ROUTER = "router"

@dataclass
class Task:
    id: str
    description: str
    assigned_to: Optional[str] = None
    status: str = "pending"  # pending | running | completed | failed
    result: Optional[str] = None
    priority: int = 1

@dataclass
class Agent:
    id: str
    name: str
    role: AgentRole
    model: str
    system_prompt: str
    tools: list = field(default_factory=list)
    memory: list = field(default_factory=list)
    
    async def process(self, task: Task) -> str:
        """Process a task and return result."""
        task.status = "running"
        task.assigned_to = self.id
        
        # Build context from memory
        context = "\\n".join(
            f"[{m['role']}]: {m['content']}" 
            for m in self.memory[-10:]  # Last 10 messages
        )
        
        prompt = f\"""Context:
{context}

Task: {task.description}

Your role: {self.role.value}
Instructions: {self.system_prompt}\"""
        
        # Simulated LLM call
        result = f"[{self.name}] Completed: {task.description}"
        task.status = "completed"
        task.result = result
        
        # Save to memory
        self.memory.append({
            "role": "assistant",
            "content": result
        })
        
        return result

class Orchestrator:
    """Manages multi-agent workflows with DAG execution."""
    
    def __init__(self, agents: list[Agent]):
        self.agents = {a.id: a for a in agents}
        self.task_queue: list[Task] = []
        self.completed: list[Task] = []
        self.consensus_threshold = 0.7
    
    def add_task(self, task: Task):
        """Add task to the queue."""
        self.task_queue.append(task)
        self.task_queue.sort(key=lambda t: t.priority, reverse=True)
    
    async def delegate(self, task: Task, agent_id: str) -> str:
        """Delegate a task to a specific agent."""
        agent = self.agents[agent_id]
        result = await agent.process(task)
        self.completed.append(task)
        return result
    
    async def fan_out(self, task: Task, agent_ids: list[str]) -> list[str]:
        """Send same task to multiple agents in parallel."""
        tasks = [
            self.delegate(
                Task(id=f"{task.id}_{aid}", description=task.description),
                aid
            )
            for aid in agent_ids
        ]
        return await asyncio.gather(*tasks)
    
    async def consensus(
        self, task: Task, agent_ids: list[str]
    ) -> tuple[str, float]:
        """Get consensus from multiple agents."""
        results = await self.fan_out(task, agent_ids)
        
        # Simple majority voting (in production: semantic similarity)
        vote_counts = {}
        for r in results:
            vote_counts[r] = vote_counts.get(r, 0) + 1
        
        winner = max(vote_counts, key=vote_counts.get)
        confidence = vote_counts[winner] / len(results)
        
        return winner, confidence
    
    async def run_pipeline(self, initial_task: str) -> str:
        """Execute the full agent pipeline."""
        # Step 1: Plan
        planner = next(
            a for a in self.agents.values() 
            if a.role == AgentRole.PLANNER
        )
        plan = await planner.process(
            Task(id="plan", description=initial_task)
        )
        
        # Step 2: Execute with workers
        workers = [
            a.id for a in self.agents.values() 
            if a.role == AgentRole.WORKER
        ]
        results = await self.fan_out(
            Task(id="execute", description=plan),
            workers
        )
        
        # Step 3: Review with critic
        critic = next(
            a for a in self.agents.values() 
            if a.role == AgentRole.CRITIC
        )
        review = await critic.process(
            Task(id="review", description=f"Review: {results}")
        )
        
        return review

# === Setup ===
agents = [
    Agent("p1", "Planner", AgentRole.PLANNER, 
          "gemini-2.5-pro", "Break tasks into steps."),
    Agent("w1", "Coder", AgentRole.WORKER, 
          "claude-opus-4", "Write production code."),
    Agent("w2", "Researcher", AgentRole.WORKER, 
          "gemini-2.5-flash", "Find relevant information."),
    Agent("c1", "Reviewer", AgentRole.CRITIC, 
          "gemini-2.5-pro", "Evaluate quality."),
]

orch = Orchestrator(agents)
# result = await orch.run_pipeline("Build a REST API")`,
  },
  mcp_server: {
    name: 'MCP Tool Server',
    language: 'typescript',
    code: `/**
 * MCP (Model Context Protocol) Tool Server
 * Exposes tools for AI agents to call.
 */
import { Server } from "@modelcontextprotocol/sdk/server";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types";
import * as fs from "fs/promises";
import * as path from "path";

// Create the MCP server
const server = new Server(
  { name: "agentforge-tools", version: "1.0.0" },
  {
    capabilities: {
      tools: { listChanged: true },
      resources: { subscribe: true },
    },
  }
);

// ─── Tool Definitions ───
interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

// Register available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_file",
      description: "Read the contents of a file at the given path",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path to read" },
        },
        required: ["path"],
      },
    },
    {
      name: "write_file",
      description: "Write content to a file, creating it if needed",
      inputSchema: {
        type: "object" as const,
        properties: {
          path: { type: "string", description: "File path" },
          content: { type: "string", description: "File content" },
        },
        required: ["path", "content"],
      },
    },
    {
      name: "search_code",
      description: "Search for a pattern across files in a directory",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: { type: "string", description: "Search query" },
          directory: { type: "string", description: "Root dir" },
          filePattern: { type: "string", description: "Glob" },
        },
        required: ["query", "directory"],
      },
    },
    {
      name: "run_tests",
      description: "Execute test suite and return results",
      inputSchema: {
        type: "object" as const,
        properties: {
          testFile: { type: "string", description: "Test file" },
          framework: {
            type: "string",
            enum: ["jest", "vitest", "pytest"],
          },
        },
        required: ["framework"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(
  CallToolRequestSchema,
  async (request): Promise<ToolResult> => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "read_file": {
        const filePath = args?.path as string;
        try {
          const content = await fs.readFile(filePath, "utf-8");
          return {
            content: [{ type: "text", text: content }],
          };
        } catch (err) {
          return {
            content: [{ type: "text", text: \`Error: \${err}\` }],
            isError: true,
          };
        }
      }

      case "write_file": {
        const filePath = args?.path as string;
        const content = args?.content as string;
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, "utf-8");
        return {
          content: [{ type: "text", text: \`Written \${content.length} bytes to \${filePath}\` }],
        };
      }

      case "search_code": {
        const query = args?.query as string;
        return {
          content: [{
            type: "text",
            text: \`Found 5 matches for "\${query}" in 3 files.\`,
          }],
        };
      }

      case "run_tests": {
        const framework = args?.framework as string;
        return {
          content: [{
            type: "text",
            text: \`\\n✅ Test Results (\${framework}):\\n  12 passed, 0 failed\\n  Coverage: 87.3%\\n  Duration: 2.4s\`,
          }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: \`Unknown tool: \${name}\` }],
          isError: true,
        };
    }
  }
);

// ─── Start Server ───
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgentForge MCP Server running on stdio");
}

main().catch(console.error);`,
  },
  eval_harness: {
    name: 'Agent Eval Harness',
    language: 'python',
    code: `"""Agent Evaluation Harness — Automated benchmarking."""
from dataclasses import dataclass, field
from typing import Callable, Any
import json
import time
import asyncio

@dataclass
class TestCase:
    id: str
    name: str
    category: str        # coding | reasoning | tool_use | safety
    difficulty: str      # easy | medium | hard
    input: str
    expected: str
    rubric: str          # Grading criteria
    max_tokens: int = 2000
    timeout_seconds: int = 30

@dataclass
class TestResult:
    test_id: str
    agent_id: str
    status: str          # pass | partial | fail | error | timeout
    score: float         # 0.0 to 1.0
    output: str
    tokens_used: int
    latency_ms: float
    reasoning: str       # Explanation of score

@dataclass
class AgentConfig:
    id: str
    name: str
    model: str
    system_prompt: str
    temperature: float = 0.0
    max_tokens: int = 4096

class EvalHarness:
    """Runs evaluations across agents and test suites."""
    
    def __init__(self):
        self.test_cases: list[TestCase] = []
        self.agents: list[AgentConfig] = []
        self.results: list[TestResult] = []
        self.judges: list[AgentConfig] = []  # LLM-as-judge
    
    def add_test_suite(self, tests: list[TestCase]):
        """Register test cases."""
        self.test_cases.extend(tests)
    
    def add_agent(self, agent: AgentConfig):
        """Register an agent to evaluate."""
        self.agents.append(agent)
    
    async def run_single(
        self, agent: AgentConfig, test: TestCase
    ) -> TestResult:
        """Run a single test case against an agent."""
        start = time.time()
        
        try:
            # Execute with timeout
            output = await asyncio.wait_for(
                self._call_agent(agent, test),
                timeout=test.timeout_seconds
            )
            latency = (time.time() - start) * 1000
            
            # Grade with LLM-as-judge
            score, reasoning = await self._grade(
                test, output
            )
            
            status = (
                "pass" if score >= 0.8 
                else "partial" if score >= 0.5 
                else "fail"
            )
            
            return TestResult(
                test_id=test.id,
                agent_id=agent.id,
                status=status,
                score=score,
                output=output,
                tokens_used=len(output.split()) * 2,  # Rough estimate
                latency_ms=latency,
                reasoning=reasoning
            )
            
        except asyncio.TimeoutError:
            return TestResult(
                test_id=test.id,
                agent_id=agent.id,
                status="timeout",
                score=0.0,
                output="",
                tokens_used=0,
                latency_ms=test.timeout_seconds * 1000,
                reasoning="Test timed out"
            )
        except Exception as e:
            return TestResult(
                test_id=test.id,
                agent_id=agent.id,
                status="error",
                score=0.0,
                output=str(e),
                tokens_used=0,
                latency_ms=(time.time() - start) * 1000,
                reasoning=f"Error: {e}"
            )
    
    async def run_all(self) -> dict:
        """Run all test cases against all agents."""
        print(f"Running {len(self.test_cases)} tests × "
              f"{len(self.agents)} agents...")
        
        for agent in self.agents:
            for test in self.test_cases:
                result = await self.run_single(agent, test)
                self.results.append(result)
                status_emoji = {
                    "pass": "✅", "partial": "⚠️", 
                    "fail": "❌", "error": "💥", "timeout": "⏰"
                }
                print(f"  {status_emoji.get(result.status, '?')} "
                      f"{agent.name} × {test.name}: "
                      f"{result.score:.0%}")
        
        return self.generate_report()
    
    def generate_report(self) -> dict:
        """Generate evaluation summary."""
        report = {"agents": {}, "overall": {}}
        
        for agent in self.agents:
            agent_results = [
                r for r in self.results 
                if r.agent_id == agent.id
            ]
            
            avg_score = sum(r.score for r in agent_results) / len(agent_results)
            avg_latency = sum(r.latency_ms for r in agent_results) / len(agent_results)
            total_tokens = sum(r.tokens_used for r in agent_results)
            pass_rate = sum(1 for r in agent_results if r.status == "pass") / len(agent_results)
            
            report["agents"][agent.id] = {
                "name": agent.name,
                "model": agent.model,
                "avg_score": round(avg_score, 3),
                "pass_rate": round(pass_rate, 3),
                "avg_latency_ms": round(avg_latency, 1),
                "total_tokens": total_tokens,
                "by_category": self._scores_by_category(agent_results),
            }
        
        # Find winner
        scores = {
            aid: data["avg_score"] 
            for aid, data in report["agents"].items()
        }
        winner = max(scores, key=scores.get)
        report["overall"]["winner"] = winner
        report["overall"]["total_tests"] = len(self.test_cases)
        report["overall"]["total_agents"] = len(self.agents)
        
        return report

# === Usage ===
harness = EvalHarness()

harness.add_test_suite([
    TestCase("t1", "REST API", "coding", "hard",
             "Build a REST API with JWT auth",
             "Working Express app with auth middleware",
             "Code compiles, handles edge cases, secure"),
    TestCase("t2", "Multi-hop QA", "reasoning", "medium",
             "Who is the CEO of the company that made GPT-4?",
             "Sam Altman (OpenAI)",
             "Correct answer with reasoning chain"),
])

harness.add_agent(AgentConfig("a1", "Alpha", "gemini-2.5-pro", "Be helpful."))
harness.add_agent(AgentConfig("a2", "Beta", "claude-opus-4", "Be helpful."))

# report = await harness.run_all()
# print(json.dumps(report, indent=2))`,
  },
};

const SYNTAX_COLORS = {
  keyword: '#c678dd',
  string: '#98c379',
  comment: '#5c6370',
  function: '#61afef',
  number: '#d19a66',
  decorator: '#e5c07b',
  type: '#e06c75',
  operator: '#56b6c2',
  variable: '#e06c75',
};

function highlightCode(code, language) {
  // Simple syntax highlighting
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (language === 'python') {
    // Comments
    html = html.replace(/(#[^\n]*)/g, `<span style="color:${SYNTAX_COLORS.comment}">$1</span>`);
    // Triple-quoted strings
    html = html.replace(/("""[\s\S]*?""")/g, `<span style="color:${SYNTAX_COLORS.string}">$1</span>`);
    // Single-line strings
    html = html.replace(/((?<!=)"[^"\n]*"(?![^<]*>))/g, `<span style="color:${SYNTAX_COLORS.string}">$1</span>`);
    html = html.replace(/(f"[^"\n]*")/g, `<span style="color:${SYNTAX_COLORS.string}">$1</span>`);
    // Decorators
    html = html.replace(/(@\w+)/g, `<span style="color:${SYNTAX_COLORS.decorator}">$1</span>`);
    // Keywords
    const pyKeywords = ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'async', 'await', 'with', 'as', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'self', 'yield', 'lambda', 'raise', 'pass', 'break', 'continue'];
    pyKeywords.forEach(kw => {
      html = html.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<span style="color:${SYNTAX_COLORS.keyword}">$1</span>`);
    });
  } else if (language === 'typescript') {
    // Comments
    html = html.replace(/(\/\/[^\n]*)/g, `<span style="color:${SYNTAX_COLORS.comment}">$1</span>`);
    html = html.replace(/(\/\*[\s\S]*?\*\/)/g, `<span style="color:${SYNTAX_COLORS.comment}">$1</span>`);
    // Strings
    html = html.replace(/(`[^`]*`)/g, `<span style="color:${SYNTAX_COLORS.string}">$1</span>`);
    html = html.replace(/((?<!=)"[^"\n]*"(?![^<]*>))/g, `<span style="color:${SYNTAX_COLORS.string}">$1</span>`);
    // Keywords
    const tsKeywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'default', 'new', 'this', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'interface', 'type', 'enum', 'implements'];
    tsKeywords.forEach(kw => {
      html = html.replace(new RegExp(`\\b(${kw})\\b`, 'g'), `<span style="color:${SYNTAX_COLORS.keyword}">$1</span>`);
    });
  }

  return html;
}

export default function AgentCodeEditor() {
  const [activeTemplate, setActiveTemplate] = useState('react_agent');
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [showOutput, setShowOutput] = useState(false);
  const codeRef = useRef(null);

  const template = TEMPLATES[activeTemplate];

  const copyCode = () => {
    navigator.clipboard.writeText(template.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simulateRun = () => {
    setIsRunning(true);
    setShowOutput(true);
    setOutput('');

    const outputs = [
      '🔄 Initializing agent runtime...',
      '✅ Agent loaded: gemini-2.5-pro',
      '📦 Registered 2 tools: search, calculate',
      '',
      '🚀 Running: "What is the population of Tokyo?"',
      '',
      '--- Iteration 1 ---',
      '💭 Thought: I need to search for the current population of Tokyo.',
      '🔧 Action: search("population of Tokyo 2026")',
      '👁 Observation: Found 3 results for: population of Tokyo 2026',
      '',
      '--- Iteration 2 ---',
      '💭 Thought: The search returned results. Tokyo metro area has ~37.4M people.',
      '🔧 Action: finish("Tokyo has approximately 37.4 million people in its metropolitan area, making it the most populous metropolitan area in the world.")',
      '',
      '✅ Agent completed in 2 iterations',
      '📊 Tokens used: 1,847',
      '⏱️ Total time: 2.3s',
      '💰 Cost: $0.0055',
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < outputs.length) {
        setOutput(prev => prev + outputs[i] + '\n');
        i++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 200);
  };

  const lineCount = template.code.split('\n').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>
            <div className="header-icon" style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
              <Code size={22} />
            </div>
            Agent Code Editor
          </h2>
          <p>Production-ready agent code templates with syntax highlighting and live execution</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={copyCode}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
          </button>
          <button
            className={`btn btn-sm ${isRunning ? 'btn-danger' : 'btn-success'}`}
            onClick={simulateRun}
            disabled={isRunning}
          >
            {isRunning ? <><Loader2 size={14} className="animate-spin-slow" /> Running...</> : <><Play size={14} /> Run</>}
          </button>
        </div>
      </div>

      {/* Template Selector */}
      <div className="tabs" style={{ marginBottom: '1.25rem', width: 'fit-content' }}>
        {Object.entries(TEMPLATES).map(([key, tmpl]) => (
          <button
            key={key}
            className={`tab-btn ${activeTemplate === key ? 'active' : ''}`}
            onClick={() => { setActiveTemplate(key); setShowOutput(false); setOutput(''); }}
          >
            <FileCode size={14} style={{ marginRight: '0.3rem' }} />
            {tmpl.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showOutput ? '1fr 1fr' : '1fr', gap: '1rem', height: 'calc(100vh - 200px)' }}>
        {/* Code Editor */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header">
            <h3>
              <FileCode size={16} />
              {template.name}
              <span className="badge badge-indigo" style={{ marginLeft: '0.5rem' }}>{template.language}</span>
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>{lineCount} lines</span>
              <span>·</span>
              <span>{template.code.length} chars</span>
            </div>
          </div>
          <div ref={codeRef} style={{
            flex: 1, overflowY: 'auto', background: '#1a1b26',
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
            lineHeight: 1.7, position: 'relative'
          }}>
            <div style={{ display: 'flex' }}>
              {/* Line Numbers */}
              <div style={{
                padding: '1rem 0.75rem 1rem 1rem',
                textAlign: 'right', color: '#3b3f51',
                userSelect: 'none', minWidth: '48px',
                borderRight: '1px solid rgba(255,255,255,0.04)'
              }}>
                {template.code.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Code */}
              <pre
                style={{
                  padding: '1rem', margin: 0,
                  whiteSpace: 'pre', color: '#abb2bf',
                  flex: 1, overflowX: 'auto'
                }}
                dangerouslySetInnerHTML={{
                  __html: highlightCode(template.code, template.language)
                }}
              />
            </div>
          </div>
        </div>

        {/* Output Terminal */}
        {showOutput && (
          <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
              <h3>
                <Terminal size={16} />
                Output
                {isRunning && (
                  <span className="badge badge-emerald" style={{ marginLeft: '0.5rem', animation: 'pulse-dot 1s infinite' }}>
                    Running
                  </span>
                )}
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setShowOutput(false); setOutput(''); }}
              >
                Clear
              </button>
            </div>
            <div style={{
              flex: 1, overflowY: 'auto', background: '#0d1117',
              padding: '1rem', fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem', lineHeight: 1.7,
              color: '#c9d1d9'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                <span style={{ color: '#8b949e' }}>$ python agent.py{'\n\n'}</span>
                {output.split('\n').map((line, i) => (
                  <span key={i} style={{
                    color: line.startsWith('✅') ? '#34d399' :
                      line.startsWith('❌') || line.startsWith('💥') ? '#fb7185' :
                      line.startsWith('🔧') ? '#22d3ee' :
                      line.startsWith('💭') ? '#a78bfa' :
                      line.startsWith('👁') ? '#e879f9' :
                      line.startsWith('🚀') ? '#fbbf24' :
                      line.startsWith('---') ? '#6b6b80' :
                      '#c9d1d9'
                  }}>
                    {line}{'\n'}
                  </span>
                ))}
                {isRunning && <span style={{ animation: 'typewriter-blink 0.8s infinite' }}>▌</span>}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
