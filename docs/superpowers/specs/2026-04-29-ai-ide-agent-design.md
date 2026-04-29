# AI IDE Agent Design

Date: 2026-04-29
Status: Approved design draft
Source PRD: `IDE-Agent-PRD-中文整合版.md`

## 1. Summary

Build an open-source, local-first AI IDE Agent platform that brings third-party large language models into a trustworthy software engineering workflow.

The product is not a foundation model and does not depend on a single model vendor. It provides the engineering layer around LLMs: context orchestration, task planning, model routing, controlled execution, reviewable diffs, verification evidence, project memory, and budget visibility.

Primary positioning:

> From Prompt to Proof.

Chinese positioning:

> 从一句需求，到可验证的工程结果。

The first public version should target a near-Beta experience, not only a skeleton prototype. It should be usable enough for developers to install from GitHub, connect their own model provider, open a real workspace, inspect what the agent knows, approve a task plan, review proposed changes, and see verification evidence.

## 2. Product Decisions

### 2.1 MVP Shape

Use **VS Code Extension + Local Agent Service** as the open-source MVP shape.

The long-term product vision may evolve into a standalone desktop IDE, but the first GitHub release should not spend most of its effort rebuilding editor infrastructure. VS Code-compatible editors already provide file editing, terminal integration, diagnostics, Git integration, diff views, and an extension platform.

Target editors:

- VS Code
- Cursor, where compatible with VS Code extension APIs
- VSCodium, where compatible with VS Code extension APIs

### 2.2 Completion Level

Target a **near-Beta** first version:

- Multi-provider model configuration
- Project scanning and context map
- Context Ledger
- Task Spec Before Action
- Change Capsules
- Debug Hypothesis Mode
- Verification Gate
- Project Memory and Memory Update Proposal
- Budget and limits console
- Local-first persistence
- GitHub-ready documentation and contribution boundaries

### 2.3 Local-First Policy

The system is local-first by default:

- Source code stays in the local workspace.
- Project memory, task history, context index metadata, and verification evidence are stored locally.
- API keys are stored in the operating system secret storage.
- Only task-relevant context selected by the Context Ledger is sent to configured LLM providers.
- Sensitive directories and `never-use` rules must be enforced before provider calls.

Cloud sync, hosted background agents, and team permissions are future extensions, not part of the first design.

### 2.4 Language and Documentation

Use English-first open-source materials:

- README, package names, code identifiers, API contracts, comments, and contribution docs should be English-first.
- Keep the Chinese PRD and a Chinese product overview in the repository for Chinese-speaking users.
- Avoid maintaining fully duplicated bilingual technical docs in the first release unless there is a clear owner for both languages.

## 3. Architecture

Use a TypeScript monorepo with a thin editor extension and reusable local agent core.

```text
Editor Extension
  -> Agent Protocol
  -> Local Agent Core
       -> Context Engine
       -> Task Planner
       -> Model Router
       -> Execution Agent
       -> Review Layer
       -> Verification Layer
       -> Memory Store
       -> Budget Console
       -> Provider Registry
            -> OpenAI Provider
            -> Anthropic Provider
            -> Gemini Provider
            -> DeepSeek Provider
            -> Qwen Provider
            -> Minimax Provider
            -> Kimi Provider
            -> GLM Provider
            -> Ollama Provider
            -> OpenAI-Compatible Provider
```

### 3.1 Editor Extension

The extension is a thin shell. It owns editor-facing behavior:

- Agent panel
- Command palette entries
- Workspace selection and file references
- Diff display
- Inline status indicators
- User approvals
- VS Code-compatible secret storage integration
- Bridge to diagnostics, terminal, Git, and test commands

It should avoid embedding the full agent workflow directly. The core product logic belongs in `agent-core`.

### 3.2 Local Agent Core

The local agent core is the main reusable product layer. It owns:

- Context Engine
- Task Planner
- Model Router
- Execution Agent
- Review Layer
- Verification Layer
- Project Memory
- Task History
- Budget and limits console
- Provider Registry

The core must be editor-agnostic so it can later be reused by a CLI, desktop IDE, or other editor clients.

### 3.3 Protocol Layer

The extension and local agent core communicate through a typed protocol. The protocol should be transport-neutral where possible, so it can work over an in-process adapter first and later over stdio, HTTP localhost, WebSocket, or a desktop runtime bridge.

The protocol should include:

- Workspace metadata
- Task requests
- Context Ledger updates
- Task Spec updates
- Provider configuration metadata
- Change Capsule updates
- Verification events
- Memory proposals
- Error and status events

## 4. Monorepo Structure

Recommended packages:

```text
apps/
  extension/             VS Code-compatible extension

packages/
  agent-core/            Core agent orchestration
  protocol/              Shared request/event contracts
  providers/             Model provider adapters and registry
  storage/               Local persistence and secret abstractions
  ui/                    Shared webview UI components
  cli/                   Optional local CLI for debugging and automation
  shared/                Common types and utilities

docs/
  prd/                   Original and summarized PRD materials
  architecture/          Architecture notes
  providers/             Provider adapter guide
  contributors/          Contribution guide
  superpowers/specs/     Design and implementation specs
```

The first implementation can start smaller, but package boundaries should point toward this shape so contributors know where to add features.

## 5. LLM Provider API

### 5.1 Provider Contract

Business logic must depend on a unified provider contract instead of vendor SDKs.

Core interface:

```ts
export interface ModelProvider {
  id: string;
  displayName: string;
  capabilities: ProviderCapabilities;
  listModels(): Promise<ModelDescriptor[]>;
  complete(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<ChatResponseChunk>;
  estimateCost?(request: ChatRequest): Promise<CostEstimate>;
  validateConfig(config: ProviderConfig): Promise<ProviderValidationResult>;
}
```

Default provider targets:

- OpenAI
- Anthropic Claude
- Google Gemini
- DeepSeek
- Qwen
- Minimax
- Kimi / Moonshot AI
- GLM / Zhipu AI
- Ollama
- OpenAI-compatible endpoints
- Local model runtimes that can expose a compatible API

### 5.2 Unified Request Format

Agent Core uses one internal request format:

```ts
export interface ChatRequest {
  messages: ChatMessage[];
  system?: string;
  tools?: ToolDefinition[];
  responseSchema?: JsonSchema;
  contextLedgerRefs?: ContextLedgerRef[];
  budget?: BudgetHint;
  model?: string;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}
```

Provider adapters translate this internal request into each provider's API shape.

### 5.3 Model Capability Declaration

Each model must declare capabilities so the router can choose safely:

- Chat
- Streaming
- Tool calling
- Structured output
- Vision
- Large context
- Local execution
- Cost estimation
- JSON mode or schema output

The router should select based on capability, task type, risk, context size, budget, and fallback policy instead of hardcoding specific model names.

### 5.4 Secrets and Privacy

API keys are never stored in plain project files. The extension should use VS Code-compatible secret storage where available. The local core should receive a resolved provider credential only at call time or through a secret abstraction.

Before a provider call, Agent Core must enforce:

- Excluded paths
- `never-use` rules
- Sensitive file policies
- Context Ledger scope
- User-approved task plan for high-risk operations

## 6. Task Lifecycle

The primary workflow is:

```text
User request
  -> Task Intent
  -> Context Ledger
  -> Task Spec
  -> User Gate
  -> Execution
  -> Change Capsules
  -> Verification Gate
  -> Proof + Memory Update Proposal
```

### 6.1 Task Intent

Supported modes:

- `Ask`: answer questions without editing files
- `Edit`: controlled file edits with visible diff
- `Delegate`: agent can execute multi-step tasks within explicit scope
- `Debug`: hypothesis-driven debugging loop
- `Review`: review local diff or pull request-like change set

Task Intent includes:

- User goal
- Mode
- Risk level
- Expected files or modules
- Budget mode
- Verification expectations

### 6.2 Context Ledger

Context Ledger answers: what does the agent know?

It should show:

- Files read
- Files matched by index but not read
- Rules applied
- Memory references used
- Pinned files
- Excluded files
- `never-use` paths
- Potentially missing critical context
- Stale context warnings

User controls:

- `pin`
- `must-read`
- `exclude`
- `never-use`

### 6.3 Task Spec Before Action

Before edits, the agent produces a task spec:

- Goal understanding
- Mode
- Planned files
- Change scope
- Risks
- Verification plan
- Estimated cost and duration
- Selected model and fallback model

High-risk actions require explicit user approval before execution.

### 6.4 Execution Agent

The Execution Agent modifies files only within the approved scope.

Rules:

- Every change must trace back to a task plan or debug hypothesis.
- The agent should not expand scope without explaining why.
- Command output and errors are captured as runtime context.
- High-risk changes require user review before write or final application.

### 6.5 Change Capsules

Change Capsules organize diffs by intent instead of only by file.

Each capsule includes:

- Intent
- Why the change exists
- Files involved
- Scope and risk
- Linked task spec section or debug hypothesis
- Verification result
- Remaining risk

### 6.6 Debug Hypothesis Mode

Debug mode follows a structured loop:

```text
Symptom
  -> Reproduction
  -> Hypothesis
  -> Planned observation or edit
  -> Verification
  -> Confirm, reject, or revise hypothesis
```

Only one primary hypothesis should be tested per round. Failures should create a new hypothesis instead of uncontrolled edits.

### 6.7 Verification Gate

The agent cannot mark a task as `Verified` without evidence.

Acceptable evidence:

- Tests passed
- Lint passed
- Build passed
- Dev server started successfully
- API call succeeded
- Preview or screenshot inspected
- Logs checked for new errors
- User acceptance checklist completed

Task states:

- `Draft`
- `Implemented`
- `Verified`
- `Needs Review`
- `Blocked`

Without verification evidence, the final state can be `Implemented` or `Needs Review`, but not `Verified`.

## 7. UI Information Architecture

The extension panel should use compact, work-focused panels rather than a marketing layout.

Primary tabs:

- `Task`
- `Context`
- `Changes`
- `Verify`
- `Memory`
- `Models`

### 7.1 Task Panel

Shows:

- Current request
- Mode
- Task state
- Risk level
- Selected model
- Budget estimate
- Task Spec
- Approval controls

### 7.2 Context Panel

Shows:

- Context Ledger
- Files read
- Indexed-but-not-read matches
- Rules
- Memory references
- Pinned context
- Excluded context
- Missing context warnings

Controls:

- Pin
- Must-read
- Exclude
- Never-use

### 7.3 Changes Panel

Shows:

- Change Capsules
- Diff summary
- File-level diff
- Risk notes
- Links to task spec sections or debug hypotheses

### 7.4 Verify Panel

Shows:

- Verification plan
- Command runs
- Logs
- Test results
- Build results
- Preview/screenshot evidence where applicable
- Final task status

### 7.5 Memory Panel

Shows:

- Project Facts
- Coding Rules
- Architecture Decisions
- User Preferences
- Task History
- Known Pitfalls
- Memory Update Proposal

Long-term memory writes require user confirmation.

### 7.6 Models Panel

Shows:

- Configured providers
- Available models
- Model capabilities
- Cost hints
- Fallback policy
- Provider validation status

## 8. Local Data Model

### 8.1 Persisted Locally

Persist:

- Project memory
- Task history
- Context index metadata
- Provider configuration metadata
- Verification evidence
- User preferences
- Budget settings

### 8.2 Secret Storage

Store API keys and sensitive provider credentials in OS or editor secret storage, not in repository files.

### 8.3 Do Not Persist by Default

Do not persist full source file contents inside long-term memory by default. Store references, summaries, hashes, and provenance instead.

Avoid persisting:

- Secrets
- Tokens
- Cookies
- Personal private data
- Unconfirmed guesses
- Stale conclusions
- Sensitive source snapshots

## 9. Budget and Limits Console

The budget console should estimate and show:

- Selected model
- Estimated input and output tokens
- Estimated cost
- Current task burn rate
- Remaining budget risk
- Most expensive planned steps
- Suggested cheaper fallback where appropriate

The first version may use approximate estimates. The UI should label estimates clearly and update them as context changes.

## 10. Review Mesh

High-risk work can trigger additional review:

- Second-model review
- Static analyzer review
- Human checklist
- Required verification command

Example policies:

- Auth changes require review.
- Database migrations require rollback notes.
- UI changes require preview or screenshot evidence.
- Large diffs require a regression scan.

## 11. Testing Strategy

Use focused tests at each boundary.

Recommended test layers:

- Unit tests for provider adapters using mocked transport
- Unit tests for Model Router selection
- Unit tests for Context Ledger filtering and policy enforcement
- Unit tests for Task Planner output normalization
- Integration tests for local Agent Core task lifecycle
- Extension tests for command registration and panel boot
- Snapshot or DOM tests for critical webview states
- Verification runner tests using sample fixtures

Provider tests should not require real API keys by default. Real provider checks can live behind explicit environment variables and should not run in the default CI path.

## 12. Open-Source Readiness

GitHub launch materials should include:

- README with positioning, screenshots, quick start, and provider setup
- CONTRIBUTING guide
- Provider adapter contribution guide
- Code of conduct
- Security policy
- Example `.env.example` without real secrets
- Issue templates for provider bugs, context bugs, and verification bugs
- Roadmap showing standalone desktop IDE as a future direction

The repository should make it easy for contributors to add:

- A new provider adapter
- A new verification runner
- A new context scanner
- A new UI panel section
- A new policy rule

## 13. Non-Goals for First Release

The first release will not include:

- Self-hosted foundation model training
- Full cloud background agents
- Team permission system
- GitHub/GitLab code review replacement
- Fully autonomous large PR generation
- Full standalone desktop IDE shell
- Mandatory cloud account

## 14. Risks and Mitigations

### Risk: Scope Too Large for First Open-Source Release

Mitigation: Keep the monorepo boundaries but implement vertical slices. The first slice should prove the end-to-end lifecycle with a limited command set and a small number of providers.

### Risk: Provider API Differences Leak Into Core Logic

Mitigation: Enforce adapter tests and capability declarations. Core logic should only use the unified `ChatRequest` and model capability metadata.

### Risk: Context Privacy Mistakes

Mitigation: Make Context Ledger and path policies mandatory before provider calls. Add tests for excluded and `never-use` paths.

### Risk: UI Becomes Too Busy

Mitigation: Use tabs and task-state summaries. Keep panels operational and dense, but avoid nesting too many cards or adding marketing-style surfaces.

### Risk: Verification Is Too Expensive or Slow

Mitigation: Support verification modes: `Strict`, `Balanced`, and `Fast`. Only `Verified` requires evidence.

## 15. Design Approval Record

Confirmed decisions:

- MVP shape: VS Code Extension + Local Agent Service
- Long-term route: standalone desktop IDE as future roadmap
- Completion level: near-Beta
- Editor target: VS Code-compatible editors
- Deployment posture: local-first
- Documentation posture: English-first with Chinese supplement
- Engineering approach: TypeScript monorepo, thin extension, reusable local agent core
- Provider posture: unified adapter API for mainstream LLM providers
- Workflow: Context Ledger, Task Spec Before Action, Change Capsules, Debug Hypothesis Mode, Verification Gate, Memory Update Proposal

## 16. Chinese Summary

第一版开源项目采用 VS Code 兼容扩展 + 本地 Agent 服务。扩展负责编辑器 UI、命令入口、diff 展示和用户确认；本地 Agent Core 负责上下文、任务计划、多模型路由、执行、审查、验证、Memory 和预算控制。

系统默认 local-first：代码、memory、任务历史、索引元数据和验证证据都保存在本机；API Key 使用系统或编辑器 secret storage；只有 Context Ledger 允许的必要上下文会发送给用户配置的模型供应商。

主流程是 From Prompt to Proof：用户需求先转成任务意图，再生成 Context Ledger 和 Task Spec，经用户确认后执行修改，用 Change Capsules 组织 diff，最后通过 Verification Gate 提供测试、构建、日志、截图或其他证据。没有验证证据的任务不能标记为 Verified。
