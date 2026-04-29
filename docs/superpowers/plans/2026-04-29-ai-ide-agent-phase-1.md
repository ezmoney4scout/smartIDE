# AI IDE Agent Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable open-source vertical slice for the AI IDE Agent: TypeScript monorepo, typed protocol, provider adapter contract, local agent lifecycle, CLI demo, and VS Code-compatible extension shell.

**Architecture:** Use a TypeScript npm-workspaces monorepo. Keep the editor extension thin and put reusable agent behavior in `packages/agent-core`; share contracts through `packages/protocol`; keep model integration behind `packages/providers`.

**Tech Stack:** TypeScript, npm workspaces, Vitest, tsup, VS Code Extension API, Node.js `fs/promises`, local JSON storage.

---

## Scope Check

The approved design covers a near-Beta product with many subsystems. This plan implements Phase 1: a working vertical slice that proves the core architecture and creates stable package boundaries. Later plans should add full Memory UI, advanced Verification Gate, Debug Hypothesis Mode, Change Capsules diff application, richer provider adapters, and GitHub release automation.

Phase 1 produces testable software on its own:

- Workspace can install and build.
- Protocol contracts compile.
- Provider registry can register and route to mock, OpenAI-compatible, Minimax, Kimi, and GLM provider presets.
- Agent Core can create a task lifecycle with Context Ledger, Task Spec, Change Capsule summary, Verification status, and Memory proposal.
- CLI can run a local demo task against a sample workspace.
- VS Code-compatible extension can open a webview panel and show a demo lifecycle from Agent Core.

## File Structure

Create these files:

```text
package.json
tsconfig.base.json
vitest.config.ts
.vscodeignore
README.md

apps/extension/package.json
apps/extension/tsconfig.json
apps/extension/src/extension.ts
apps/extension/src/panel.ts
apps/extension/src/panelHtml.ts
apps/extension/test/extension.test.ts

packages/protocol/package.json
packages/protocol/tsconfig.json
packages/protocol/src/index.ts
packages/protocol/test/protocol.test.ts

packages/providers/package.json
packages/providers/tsconfig.json
packages/providers/src/index.ts
packages/providers/src/mockProvider.ts
packages/providers/src/openAiCompatibleProvider.ts
packages/providers/src/providerPresets.ts
packages/providers/test/providerRegistry.test.ts

packages/storage/package.json
packages/storage/tsconfig.json
packages/storage/src/index.ts
packages/storage/test/localProjectStore.test.ts

packages/agent-core/package.json
packages/agent-core/tsconfig.json
packages/agent-core/src/index.ts
packages/agent-core/src/createTaskLifecycle.ts
packages/agent-core/test/createTaskLifecycle.test.ts

packages/cli/package.json
packages/cli/tsconfig.json
packages/cli/src/index.ts
packages/cli/test/cli.test.ts

docs/providers/adapter-guide.md
docs/contributors/development.md
```

Responsibilities:

- `packages/protocol`: Shared types for tasks, context ledger, providers, verification, memory, and events.
- `packages/providers`: Provider contract, registry, mock provider, OpenAI-compatible adapter, and presets for Minimax, Kimi, and GLM.
- `packages/storage`: Local JSON storage for project memory and task history.
- `packages/agent-core`: Orchestrates Phase 1 task lifecycle.
- `packages/cli`: Local demo entrypoint for contributor testing.
- `apps/extension`: VS Code-compatible extension shell and webview.

## Task 1: Scaffold TypeScript Monorepo

**Files:**

- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `.vscodeignore`

- [ ] **Step 1: Create root package manifest**

Create `package.json`:

```json
{
  "name": "ai-ide-agent",
  "version": "0.1.0",
  "private": true,
  "description": "Open-source local-first AI IDE Agent platform.",
  "license": "MIT",
  "type": "module",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "vitest run",
    "typecheck": "tsc -b packages/protocol packages/providers packages/storage packages/agent-core packages/cli apps/extension",
    "lint": "tsc -b packages/protocol packages/providers packages/storage packages/agent-core packages/cli apps/extension --pretty false",
    "demo": "node packages/cli/dist/index.js"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/vscode": "^1.96.0",
    "tsup": "^8.3.5",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create shared TypeScript config**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 3: Create Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/**/*.test.ts", "apps/**/*.test.ts"],
    environment: "node"
  }
});
```

- [ ] **Step 4: Create extension package ignore file**

Create `.vscodeignore`:

```text
.git/**
.superpowers/**
node_modules/**
packages/**/src/**
packages/**/test/**
apps/extension/src/**
apps/extension/test/**
coverage/**
docs/superpowers/**
*.map
```

- [ ] **Step 5: Install dependencies**

Run:

```bash
npm install
```

Expected: `package-lock.json` is created and dependencies install without errors.

- [ ] **Step 6: Verify empty workspace scripts fail only because packages do not exist yet**

Run:

```bash
npm test
```

Expected: Vitest starts and reports no tests or missing include targets. Continue to Task 2 before enforcing green CI.

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json package-lock.json tsconfig.base.json vitest.config.ts .vscodeignore
git commit -m "chore: scaffold TypeScript workspace"
```

## Task 2: Define Shared Protocol Contracts

**Files:**

- Create: `packages/protocol/package.json`
- Create: `packages/protocol/tsconfig.json`
- Create: `packages/protocol/src/index.ts`
- Create: `packages/protocol/test/protocol.test.ts`

- [ ] **Step 1: Create protocol package manifest**

Create `packages/protocol/package.json`:

```json
{
  "name": "@ai-ide-agent/protocol",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Create protocol TypeScript config**

Create `packages/protocol/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Write failing protocol test**

Create `packages/protocol/test/protocol.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { TaskRequest, TaskState } from "../src/index.js";
import { createContextLedgerEntry } from "../src/index.js";

describe("protocol contracts", () => {
  it("creates a readable context ledger entry", () => {
    const entry = createContextLedgerEntry({
      path: "src/auth/session.ts",
      reason: "matched user request",
      source: "read",
      tokens: 512
    });

    expect(entry.id).toBe("read:src/auth/session.ts");
    expect(entry.path).toBe("src/auth/session.ts");
    expect(entry.source).toBe("read");
    expect(entry.tokens).toBe(512);
  });

  it("allows a typed edit task request", () => {
    const task: TaskRequest = {
      id: "task-1",
      mode: "Edit",
      goal: "Add provider registry",
      workspaceRoot: "/tmp/project",
      risk: "medium",
      budget: { mode: "balanced", maxUsd: 1.5 }
    };

    const state: TaskState = "Draft";

    expect(task.mode).toBe("Edit");
    expect(state).toBe("Draft");
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run:

```bash
npx vitest run packages/protocol/test/protocol.test.ts
```

Expected: FAIL because `packages/protocol/src/index.ts` does not exist.

- [ ] **Step 5: Implement protocol contracts**

Create `packages/protocol/src/index.ts`:

```ts
export type TaskMode = "Ask" | "Edit" | "Delegate" | "Debug" | "Review";
export type RiskLevel = "low" | "medium" | "high";
export type TaskState = "Draft" | "Implemented" | "Verified" | "Needs Review" | "Blocked";
export type BudgetMode = "fast" | "balanced" | "strict";

export interface BudgetHint {
  mode: BudgetMode;
  maxUsd?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface TaskRequest {
  id: string;
  mode: TaskMode;
  goal: string;
  workspaceRoot: string;
  risk: RiskLevel;
  budget: BudgetHint;
}

export type ContextSource = "read" | "indexed" | "memory" | "rule" | "runtime";

export interface ContextLedgerEntry {
  id: string;
  path: string;
  reason: string;
  source: ContextSource;
  tokens: number;
  pinned: boolean;
  excluded: boolean;
}

export interface CreateContextLedgerEntryInput {
  path: string;
  reason: string;
  source: ContextSource;
  tokens?: number;
  pinned?: boolean;
  excluded?: boolean;
}

export function createContextLedgerEntry(input: CreateContextLedgerEntryInput): ContextLedgerEntry {
  return {
    id: `${input.source}:${input.path}`,
    path: input.path,
    reason: input.reason,
    source: input.source,
    tokens: input.tokens ?? 0,
    pinned: input.pinned ?? false,
    excluded: input.excluded ?? false
  };
}

export interface TaskSpec {
  taskId: string;
  goal: string;
  mode: TaskMode;
  plannedFiles: string[];
  risk: RiskLevel;
  verificationPlan: VerificationPlan;
  estimatedCostUsd?: number;
}

export interface ChangeCapsule {
  id: string;
  intent: string;
  reason: string;
  files: string[];
  risk: RiskLevel;
  verificationStatus: TaskState;
}

export interface VerificationPlan {
  commands: string[];
  evidenceRequired: boolean;
}

export interface VerificationEvidence {
  kind: "test" | "lint" | "build" | "preview" | "log" | "manual";
  label: string;
  status: "passed" | "failed" | "skipped";
  output?: string;
}

export interface MemoryUpdateProposal {
  facts: string[];
  rules: string[];
  decisions: string[];
  pitfalls: string[];
}

export interface TaskLifecycle {
  request: TaskRequest;
  contextLedger: ContextLedgerEntry[];
  taskSpec: TaskSpec;
  changeCapsules: ChangeCapsule[];
  verification: VerificationEvidence[];
  memoryProposal: MemoryUpdateProposal;
  state: TaskState;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  system?: string;
  tools?: ToolDefinition[];
  responseSchema?: Record<string, unknown>;
  contextLedgerRefs?: string[];
  budget?: BudgetHint;
  model?: string;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  usage?: TokenUsage;
}

export interface ChatResponseChunk {
  contentDelta: string;
  done: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
}

export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  vision: boolean;
  largeContext: boolean;
  localExecution: boolean;
  costEstimation: boolean;
}

export interface ModelDescriptor {
  id: string;
  displayName: string;
  contextWindow: number;
  capabilities: ProviderCapabilities;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface ProviderValidationResult {
  ok: boolean;
  message: string;
}
```

- [ ] **Step 6: Run protocol tests**

Run:

```bash
npx vitest run packages/protocol/test/protocol.test.ts
```

Expected: PASS.

- [ ] **Step 7: Build protocol package**

Run:

```bash
npm run build -w @ai-ide-agent/protocol
```

Expected: `packages/protocol/dist/index.js` and `index.d.ts` are generated.

- [ ] **Step 8: Commit protocol package**

```bash
git add packages/protocol
git commit -m "feat: define shared protocol contracts"
```

## Task 3: Implement Provider Registry and Adapters

**Files:**

- Create: `packages/providers/package.json`
- Create: `packages/providers/tsconfig.json`
- Create: `packages/providers/src/index.ts`
- Create: `packages/providers/src/mockProvider.ts`
- Create: `packages/providers/src/openAiCompatibleProvider.ts`
- Create: `packages/providers/src/providerPresets.ts`
- Create: `packages/providers/test/providerRegistry.test.ts`

- [ ] **Step 1: Create providers package manifest**

Create `packages/providers/package.json`:

```json
{
  "name": "@ai-ide-agent/providers",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ai-ide-agent/protocol": "0.1.0"
  }
}
```

- [ ] **Step 2: Create providers TypeScript config**

Create `packages/providers/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Write failing provider registry tests**

Create `packages/providers/test/providerRegistry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createMockProvider, createProviderFromPreset, ProviderRegistry, providerPresets } from "../src/index.js";

describe("ProviderRegistry", () => {
  it("registers and retrieves providers by id", async () => {
    const registry = new ProviderRegistry();
    const provider = createMockProvider({ id: "mock", response: "hello from mock" });

    registry.register(provider);

    expect(registry.get("mock")).toBe(provider);
    await expect(provider.complete({ messages: [{ role: "user", content: "Hi" }] })).resolves.toMatchObject({
      content: "hello from mock",
      model: "mock-model"
    });
  });

  it("throws a readable error for unknown providers", () => {
    const registry = new ProviderRegistry();

    expect(() => registry.require("missing")).toThrow("Provider not registered: missing");
  });

  it("creates Minimax, Kimi, and GLM providers from presets", async () => {
    const minimax = createProviderFromPreset("minimax", { apiKey: "test-key" });
    const kimi = createProviderFromPreset("kimi", { apiKey: "test-key" });
    const glm = createProviderFromPreset("glm", { apiKey: "test-key" });

    expect(providerPresets.map((preset) => preset.id)).toEqual(
      expect.arrayContaining(["minimax", "kimi", "glm"])
    );
    expect(minimax.displayName).toBe("Minimax");
    expect(kimi.displayName).toBe("Kimi");
    expect(glm.displayName).toBe("GLM");
    await expect(glm.listModels()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "glm-5.1" })])
    );
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run:

```bash
npx vitest run packages/providers/test/providerRegistry.test.ts
```

Expected: FAIL because provider implementation files do not exist.

- [ ] **Step 5: Implement provider registry**

Create `packages/providers/src/index.ts`:

```ts
import type {
  ChatRequest,
  ChatResponse,
  ChatResponseChunk,
  CostEstimate,
  ModelDescriptor,
  ProviderCapabilities,
  ProviderConfig,
  ProviderValidationResult
} from "@ai-ide-agent/protocol";

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

export class ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  require(id: string): ModelProvider {
    const provider = this.get(id);
    if (!provider) {
      throw new Error(`Provider not registered: ${id}`);
    }
    return provider;
  }

  list(): ModelProvider[] {
    return [...this.providers.values()];
  }
}

export const baselineCapabilities: ProviderCapabilities = {
  chat: true,
  streaming: false,
  toolCalling: false,
  structuredOutput: false,
  vision: false,
  largeContext: false,
  localExecution: false,
  costEstimation: false
};

export { createMockProvider } from "./mockProvider.js";
export { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider.js";
export { createProviderFromPreset, providerPresets } from "./providerPresets.js";
export type { ProviderPreset, ProviderPresetId } from "./providerPresets.js";
```

- [ ] **Step 6: Implement mock provider**

Create `packages/providers/src/mockProvider.ts`:

```ts
import type { ChatRequest, ChatResponse, ModelDescriptor, ProviderConfig, ProviderValidationResult } from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { baselineCapabilities } from "./index.js";

export interface MockProviderOptions {
  id: string;
  response: string;
}

export function createMockProvider(options: MockProviderOptions): ModelProvider {
  return {
    id: options.id,
    displayName: "Mock Provider",
    capabilities: baselineCapabilities,
    async listModels(): Promise<ModelDescriptor[]> {
      return [
        {
          id: "mock-model",
          displayName: "Mock Model",
          contextWindow: 8192,
          capabilities: baselineCapabilities
        }
      ];
    },
    async complete(_request: ChatRequest): Promise<ChatResponse> {
      return {
        id: "mock-response",
        model: "mock-model",
        content: options.response,
        usage: {
          inputTokens: 1,
          outputTokens: options.response.length
        }
      };
    },
    async *stream(): AsyncIterable<{ contentDelta: string; done: boolean }> {
      yield { contentDelta: options.response, done: true };
    },
    async estimateCost() {
      return {
        inputTokens: 1,
        outputTokens: options.response.length,
        estimatedUsd: 0
      };
    },
    async validateConfig(_config: ProviderConfig): Promise<ProviderValidationResult> {
      return { ok: true, message: "Mock provider is always valid." };
    }
  };
}
```

- [ ] **Step 7: Implement OpenAI-compatible adapter**

Create `packages/providers/src/openAiCompatibleProvider.ts`:

```ts
import type { ChatRequest, ChatResponse, ModelDescriptor, ProviderConfig, ProviderValidationResult } from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { baselineCapabilities } from "./index.js";

export interface OpenAiCompatibleOptions {
  id: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
}

export function createOpenAiCompatibleProvider(options: OpenAiCompatibleOptions): ModelProvider {
  const capabilities = {
    ...baselineCapabilities,
    streaming: true,
    structuredOutput: true,
    costEstimation: true
  };

  return {
    id: options.id,
    displayName: options.displayName,
    capabilities,
    async listModels(): Promise<ModelDescriptor[]> {
      return [
        {
          id: options.defaultModel,
          displayName: options.defaultModel,
          contextWindow: 128000,
          capabilities
        }
      ];
    },
    async complete(request: ChatRequest): Promise<ChatResponse> {
      const response = await fetch(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: request.model ?? options.defaultModel,
          messages: [
            ...(request.system ? [{ role: "system", content: request.system }] : []),
            ...request.messages
          ],
          temperature: request.temperature ?? 0.2,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI-compatible provider failed: ${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as {
        id?: string;
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      return {
        id: payload.id ?? "openai-compatible-response",
        model: payload.model ?? options.defaultModel,
        content: payload.choices?.[0]?.message?.content ?? "",
        usage: payload.usage
          ? {
              inputTokens: payload.usage.prompt_tokens ?? 0,
              outputTokens: payload.usage.completion_tokens ?? 0
            }
          : undefined
      };
    },
    async *stream(request: ChatRequest) {
      const response = await this.complete(request);
      yield { contentDelta: response.content, done: true };
    },
    async estimateCost(request: ChatRequest) {
      const inputTokens = request.messages.reduce((sum, message) => sum + Math.ceil(message.content.length / 4), 0);
      const outputTokens = request.budget?.maxOutputTokens ?? 1024;
      return {
        inputTokens,
        outputTokens,
        estimatedUsd: 0
      };
    },
    async validateConfig(config: ProviderConfig): Promise<ProviderValidationResult> {
      if (!config.baseUrl && !options.baseUrl) {
        return { ok: false, message: "Missing baseUrl for OpenAI-compatible provider." };
      }
      if (!config.apiKey && !options.apiKey) {
        return { ok: false, message: "Missing apiKey for OpenAI-compatible provider." };
      }
      return { ok: true, message: "Provider configuration is valid." };
    }
  };
}
```

- [ ] **Step 8: Implement provider presets**

Create `packages/providers/src/providerPresets.ts`:

```ts
import type { ProviderConfig } from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider.js";

export type ProviderPresetId = "minimax" | "kimi" | "glm";

export interface ProviderPreset {
  id: ProviderPresetId;
  displayName: string;
  baseUrl: string;
  defaultModel: string;
  docsUrl: string;
}

export const providerPresets: ProviderPreset[] = [
  {
    id: "minimax",
    displayName: "Minimax",
    baseUrl: "https://api.minimax.io/v1",
    defaultModel: "MiniMax-M2.7",
    docsUrl: "https://platform.minimax.io/docs/api-reference/text-openai-api"
  },
  {
    id: "kimi",
    displayName: "Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    defaultModel: "kimi-k2.5",
    docsUrl: "https://platform.kimi.ai/docs/api/overview"
  },
  {
    id: "glm",
    displayName: "GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-5.1",
    docsUrl: "https://docs.bigmodel.cn/cn/guide/develop/openai/introduction"
  }
];

export function createProviderFromPreset(id: ProviderPresetId, config: ProviderConfig): ModelProvider {
  const preset = providerPresets.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`Provider preset not found: ${id}`);
  }

  return createOpenAiCompatibleProvider({
    id: preset.id,
    displayName: preset.displayName,
    baseUrl: config.baseUrl ?? preset.baseUrl,
    apiKey: config.apiKey,
    defaultModel: config.defaultModel ?? preset.defaultModel
  });
}
```

- [ ] **Step 9: Run provider tests**

Run:

```bash
npx vitest run packages/providers/test/providerRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 10: Build providers package**

Run:

```bash
npm run build -w @ai-ide-agent/providers
```

Expected: provider package builds.

- [ ] **Step 11: Commit providers package**

```bash
git add packages/providers
git commit -m "feat: add provider registry and adapters"
```

## Task 4: Implement Local Project Storage

**Files:**

- Create: `packages/storage/package.json`
- Create: `packages/storage/tsconfig.json`
- Create: `packages/storage/src/index.ts`
- Create: `packages/storage/test/localProjectStore.test.ts`

- [ ] **Step 1: Create storage package manifest**

Create `packages/storage/package.json`:

```json
{
  "name": "@ai-ide-agent/storage",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ai-ide-agent/protocol": "0.1.0"
  }
}
```

- [ ] **Step 2: Create storage TypeScript config**

Create `packages/storage/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Write failing local storage test**

Create `packages/storage/test/localProjectStore.test.ts`:

```ts
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalProjectStore } from "../src/index.js";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("LocalProjectStore", () => {
  it("persists task history locally", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-ide-agent-"));
    const store = new LocalProjectStore(tempDir);

    await store.appendTaskHistory({
      taskId: "task-1",
      goal: "Create provider registry",
      state: "Draft"
    });

    const history = await store.readTaskHistory();
    const raw = await readFile(join(tempDir, ".ai-ide-agent", "task-history.json"), "utf8");

    expect(history).toHaveLength(1);
    expect(history[0]?.goal).toBe("Create provider registry");
    expect(JSON.parse(raw)).toMatchObject([{ taskId: "task-1" }]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run:

```bash
npx vitest run packages/storage/test/localProjectStore.test.ts
```

Expected: FAIL because `LocalProjectStore` does not exist.

- [ ] **Step 5: Implement local project store**

Create `packages/storage/src/index.ts`:

```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { TaskState } from "@ai-ide-agent/protocol";

export interface TaskHistoryRecord {
  taskId: string;
  goal: string;
  state: TaskState;
  createdAt: string;
}

export interface NewTaskHistoryRecord {
  taskId: string;
  goal: string;
  state: TaskState;
}

export interface ProjectMemory {
  facts: string[];
  rules: string[];
  decisions: string[];
  pitfalls: string[];
}

export class LocalProjectStore {
  private readonly dataDir: string;

  constructor(private readonly workspaceRoot: string) {
    this.dataDir = join(workspaceRoot, ".ai-ide-agent");
  }

  async appendTaskHistory(record: NewTaskHistoryRecord): Promise<void> {
    const history = await this.readTaskHistory();
    history.push({
      ...record,
      createdAt: new Date().toISOString()
    });
    await this.writeJson("task-history.json", history);
  }

  async readTaskHistory(): Promise<TaskHistoryRecord[]> {
    return this.readJson<TaskHistoryRecord[]>("task-history.json", []);
  }

  async readMemory(): Promise<ProjectMemory> {
    return this.readJson<ProjectMemory>("memory.json", {
      facts: [],
      rules: [],
      decisions: [],
      pitfalls: []
    });
  }

  async writeMemory(memory: ProjectMemory): Promise<void> {
    await this.writeJson("memory.json", memory);
  }

  private async readJson<T>(fileName: string, fallback: T): Promise<T> {
    try {
      const raw = await readFile(join(this.dataDir, fileName), "utf8");
      return JSON.parse(raw) as T;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return fallback;
      }
      throw error;
    }
  }

  private async writeJson(fileName: string, value: unknown): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await writeFile(join(this.dataDir, fileName), `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
}
```

- [ ] **Step 6: Run storage tests**

Run:

```bash
npx vitest run packages/storage/test/localProjectStore.test.ts
```

Expected: PASS.

- [ ] **Step 7: Add local data directory to gitignore**

Modify `.gitignore` and add:

```text
.ai-ide-agent/
```

- [ ] **Step 8: Commit storage package**

```bash
git add .gitignore packages/storage
git commit -m "feat: add local project storage"
```

## Task 5: Implement Agent Core Lifecycle

**Files:**

- Create: `packages/agent-core/package.json`
- Create: `packages/agent-core/tsconfig.json`
- Create: `packages/agent-core/src/index.ts`
- Create: `packages/agent-core/src/createTaskLifecycle.ts`
- Create: `packages/agent-core/test/createTaskLifecycle.test.ts`

- [ ] **Step 1: Create agent-core manifest**

Create `packages/agent-core/package.json`:

```json
{
  "name": "@ai-ide-agent/agent-core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ai-ide-agent/protocol": "0.1.0",
    "@ai-ide-agent/providers": "0.1.0",
    "@ai-ide-agent/storage": "0.1.0"
  }
}
```

- [ ] **Step 2: Create agent-core TypeScript config**

Create `packages/agent-core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Write failing lifecycle test**

Create `packages/agent-core/test/createTaskLifecycle.test.ts`:

```ts
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createMockProvider, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import { createTaskLifecycle } from "../src/index.js";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("createTaskLifecycle", () => {
  it("creates a draft lifecycle with ledger, spec, capsules, verification, and memory proposal", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-ide-agent-core-"));
    const registry = new ProviderRegistry();
    registry.register(createMockProvider({ id: "mock", response: "Use a provider registry." }));

    const lifecycle = await createTaskLifecycle({
      request: {
        id: "task-1",
        mode: "Edit",
        goal: "Add provider registry",
        workspaceRoot: tempDir,
        risk: "medium",
        budget: { mode: "balanced", maxUsd: 1 }
      },
      providerId: "mock",
      providers: registry,
      store: new LocalProjectStore(tempDir)
    });

    expect(lifecycle.state).toBe("Draft");
    expect(lifecycle.contextLedger.map((entry) => entry.source)).toContain("memory");
    expect(lifecycle.taskSpec.plannedFiles).toContain("packages/providers/src/index.ts");
    expect(lifecycle.changeCapsules[0]?.intent).toBe("Establish provider abstraction");
    expect(lifecycle.verification[0]?.status).toBe("skipped");
    expect(lifecycle.memoryProposal.decisions).toContain("Use provider adapters instead of binding Agent Core to vendor SDKs.");
  });
});
```

- [ ] **Step 4: Run lifecycle test to verify it fails**

Run:

```bash
npx vitest run packages/agent-core/test/createTaskLifecycle.test.ts
```

Expected: FAIL because `createTaskLifecycle` does not exist.

- [ ] **Step 5: Implement lifecycle factory**

Create `packages/agent-core/src/createTaskLifecycle.ts`:

```ts
import {
  createContextLedgerEntry,
  type ChangeCapsule,
  type TaskLifecycle,
  type TaskRequest,
  type TaskSpec,
  type VerificationEvidence
} from "@ai-ide-agent/protocol";
import type { ProviderRegistry } from "@ai-ide-agent/providers";
import type { LocalProjectStore } from "@ai-ide-agent/storage";

export interface CreateTaskLifecycleInput {
  request: TaskRequest;
  providerId: string;
  providers: ProviderRegistry;
  store: LocalProjectStore;
}

export async function createTaskLifecycle(input: CreateTaskLifecycleInput): Promise<TaskLifecycle> {
  const provider = input.providers.require(input.providerId);
  const memory = await input.store.readMemory();
  const providerResponse = await provider.complete({
    messages: [{ role: "user", content: input.request.goal }],
    budget: input.request.budget
  });

  const contextLedger = [
    createContextLedgerEntry({
      path: "project-memory",
      source: "memory",
      reason: memory.facts.length > 0 ? "loaded project memory" : "memory store initialized",
      tokens: memory.facts.join(" ").length
    }),
    createContextLedgerEntry({
      path: "packages/providers/src/index.ts",
      source: "indexed",
      reason: "planned provider registry work",
      tokens: 0,
      pinned: true
    })
  ];

  const taskSpec: TaskSpec = {
    taskId: input.request.id,
    goal: input.request.goal,
    mode: input.request.mode,
    plannedFiles: ["packages/providers/src/index.ts", "packages/providers/src/mockProvider.ts"],
    risk: input.request.risk,
    verificationPlan: {
      commands: ["npm test", "npm run typecheck"],
      evidenceRequired: true
    },
    estimatedCostUsd: providerResponse.usage ? 0 : undefined
  };

  const changeCapsules: ChangeCapsule[] = [
    {
      id: "capsule-provider-abstraction",
      intent: "Establish provider abstraction",
      reason: providerResponse.content,
      files: taskSpec.plannedFiles,
      risk: input.request.risk,
      verificationStatus: "Draft"
    }
  ];

  const verification: VerificationEvidence[] = [
    {
      kind: "test",
      label: "npm test",
      status: "skipped",
      output: "Verification is planned but not executed in Phase 1 lifecycle creation."
    }
  ];

  const memoryProposal = {
    facts: ["The project uses a local-first Agent Core package."],
    rules: ["Provider-specific code must stay behind provider adapters."],
    decisions: ["Use provider adapters instead of binding Agent Core to vendor SDKs."],
    pitfalls: ["Do not mark tasks as Verified without verification evidence."]
  };

  await input.store.appendTaskHistory({
    taskId: input.request.id,
    goal: input.request.goal,
    state: "Draft"
  });

  return {
    request: input.request,
    contextLedger,
    taskSpec,
    changeCapsules,
    verification,
    memoryProposal,
    state: "Draft"
  };
}
```

- [ ] **Step 6: Export lifecycle factory**

Create `packages/agent-core/src/index.ts`:

```ts
export { createTaskLifecycle } from "./createTaskLifecycle.js";
export type { CreateTaskLifecycleInput } from "./createTaskLifecycle.js";
```

- [ ] **Step 7: Run lifecycle tests**

Run:

```bash
npx vitest run packages/agent-core/test/createTaskLifecycle.test.ts
```

Expected: PASS.

- [ ] **Step 8: Build agent-core package**

Run:

```bash
npm run build -w @ai-ide-agent/agent-core
```

Expected: package builds.

- [ ] **Step 9: Commit agent-core package**

```bash
git add packages/agent-core
git commit -m "feat: add agent lifecycle vertical slice"
```

## Task 6: Add CLI Demo

**Files:**

- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/src/index.ts`
- Create: `packages/cli/test/cli.test.ts`

- [ ] **Step 1: Create CLI manifest**

Create `packages/cli/package.json`:

```json
{
  "name": "@ai-ide-agent/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "ai-ide-agent": "dist/index.js"
  },
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts --banner.js \"#!/usr/bin/env node\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ai-ide-agent/agent-core": "0.1.0",
    "@ai-ide-agent/providers": "0.1.0",
    "@ai-ide-agent/storage": "0.1.0"
  }
}
```

- [ ] **Step 2: Create CLI TypeScript config**

Create `packages/cli/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist"
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Write failing CLI test**

Create `packages/cli/test/cli.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { runDemo } from "../src/index.js";

describe("CLI demo", () => {
  it("returns lifecycle JSON for a demo task", async () => {
    const output = await runDemo("/tmp/ai-ide-agent-demo");
    const parsed = JSON.parse(output) as { state: string; taskSpec: { goal: string } };

    expect(parsed.state).toBe("Draft");
    expect(parsed.taskSpec.goal).toBe("Demonstrate the AI IDE Agent lifecycle");
  });
});
```

- [ ] **Step 4: Run CLI test to verify it fails**

Run:

```bash
npx vitest run packages/cli/test/cli.test.ts
```

Expected: FAIL because `runDemo` does not exist.

- [ ] **Step 5: Implement CLI demo**

Create `packages/cli/src/index.ts`:

```ts
import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createMockProvider, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";

export async function runDemo(workspaceRoot = process.cwd()): Promise<string> {
  const providers = new ProviderRegistry();
  providers.register(createMockProvider({ id: "mock", response: "Create a transparent task lifecycle." }));

  const lifecycle = await createTaskLifecycle({
    request: {
      id: "demo-task",
      mode: "Edit",
      goal: "Demonstrate the AI IDE Agent lifecycle",
      workspaceRoot,
      risk: "low",
      budget: { mode: "balanced", maxUsd: 0 }
    },
    providerId: "mock",
    providers,
    store: new LocalProjectStore(workspaceRoot)
  });

  return JSON.stringify(lifecycle, null, 2);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo()
    .then((output) => {
      console.log(output);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
```

- [ ] **Step 6: Run CLI test**

Run:

```bash
npx vitest run packages/cli/test/cli.test.ts
```

Expected: PASS.

- [ ] **Step 7: Build CLI and run demo**

Run:

```bash
npm run build -w @ai-ide-agent/cli
npm run demo
```

Expected: JSON prints with `state: "Draft"`, a Context Ledger, Task Spec, Change Capsule, Verification item, and Memory Update Proposal.

- [ ] **Step 8: Commit CLI**

```bash
git add packages/cli
git commit -m "feat: add local lifecycle CLI demo"
```

## Task 7: Add VS Code-Compatible Extension Shell

**Files:**

- Create: `apps/extension/package.json`
- Create: `apps/extension/tsconfig.json`
- Create: `apps/extension/src/extension.ts`
- Create: `apps/extension/src/panel.ts`
- Create: `apps/extension/src/panelHtml.ts`
- Create: `apps/extension/test/extension.test.ts`

- [ ] **Step 1: Create extension manifest**

Create `apps/extension/package.json`:

```json
{
  "name": "ai-ide-agent-extension",
  "displayName": "AI IDE Agent",
  "description": "Local-first AI IDE Agent for VS Code-compatible editors.",
  "version": "0.1.0",
  "publisher": "ai-ide-agent",
  "type": "module",
  "main": "dist/extension.js",
  "engines": {
    "vscode": "^1.96.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onCommand:aiIdeAgent.openPanel"],
  "contributes": {
    "commands": [
      {
        "command": "aiIdeAgent.openPanel",
        "title": "AI IDE Agent: Open Panel"
      }
    ]
  },
  "scripts": {
    "build": "tsup src/extension.ts --format esm --external vscode",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ai-ide-agent/agent-core": "0.1.0",
    "@ai-ide-agent/providers": "0.1.0",
    "@ai-ide-agent/storage": "0.1.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.96.0"
  }
}
```

- [ ] **Step 2: Create extension TypeScript config**

Create `apps/extension/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "dist",
    "types": ["node", "vscode"]
  },
  "include": ["src", "test"]
}
```

- [ ] **Step 3: Write failing panel HTML test**

Create `apps/extension/test/extension.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { renderPanelHtml } from "../src/panelHtml.js";

describe("extension panel HTML", () => {
  it("renders task lifecycle sections", () => {
    const html = renderPanelHtml({
      state: "Draft",
      taskGoal: "Demonstrate lifecycle",
      contextCount: 2,
      changeCapsuleCount: 1,
      verificationStatus: "skipped"
    });

    expect(html).toContain("AI IDE Agent");
    expect(html).toContain("Context Ledger");
    expect(html).toContain("Task Spec");
    expect(html).toContain("Change Capsules");
    expect(html).toContain("Verification Gate");
  });
});
```

- [ ] **Step 4: Run extension test to verify it fails**

Run:

```bash
npx vitest run apps/extension/test/extension.test.ts
```

Expected: FAIL because `panelHtml.ts` does not exist.

- [ ] **Step 5: Implement panel HTML renderer**

Create `apps/extension/src/panelHtml.ts`:

```ts
export interface PanelViewModel {
  state: string;
  taskGoal: string;
  contextCount: number;
  changeCapsuleCount: number;
  verificationStatus: string;
}

export function renderPanelHtml(model: PanelViewModel): string {
  const safeGoal = escapeHtml(model.taskGoal);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI IDE Agent</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 16px; color: var(--vscode-foreground); background: var(--vscode-editor-background); }
      h1 { font-size: 20px; margin: 0 0 12px; }
      h2 { font-size: 14px; margin: 0 0 8px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .panel { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; }
      .metric { font-size: 24px; font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>AI IDE Agent</h1>
    <p>${safeGoal}</p>
    <div class="grid">
      <section class="panel"><h2>Task Spec</h2><div class="metric">${escapeHtml(model.state)}</div></section>
      <section class="panel"><h2>Context Ledger</h2><div class="metric">${model.contextCount}</div></section>
      <section class="panel"><h2>Change Capsules</h2><div class="metric">${model.changeCapsuleCount}</div></section>
      <section class="panel"><h2>Verification Gate</h2><div class="metric">${escapeHtml(model.verificationStatus)}</div></section>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
```

- [ ] **Step 6: Implement panel orchestration**

Create `apps/extension/src/panel.ts`:

```ts
import type * as vscode from "vscode";
import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createMockProvider, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import { renderPanelHtml } from "./panelHtml.js";

export async function openAgentPanel(vscodeApi: typeof vscode): Promise<void> {
  const workspaceRoot = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const providers = new ProviderRegistry();
  providers.register(createMockProvider({ id: "mock", response: "Render the lifecycle inside the editor panel." }));

  const lifecycle = await createTaskLifecycle({
    request: {
      id: "extension-demo-task",
      mode: "Edit",
      goal: "Demonstrate the AI IDE Agent lifecycle in the editor",
      workspaceRoot,
      risk: "low",
      budget: { mode: "balanced", maxUsd: 0 }
    },
    providerId: "mock",
    providers,
    store: new LocalProjectStore(workspaceRoot)
  });

  const panel = vscodeApi.window.createWebviewPanel(
    "aiIdeAgent",
    "AI IDE Agent",
    vscodeApi.ViewColumn.Beside,
    { enableScripts: false }
  );

  panel.webview.html = renderPanelHtml({
    state: lifecycle.state,
    taskGoal: lifecycle.taskSpec.goal,
    contextCount: lifecycle.contextLedger.length,
    changeCapsuleCount: lifecycle.changeCapsules.length,
    verificationStatus: lifecycle.verification[0]?.status ?? "skipped"
  });
}
```

- [ ] **Step 7: Implement extension activation**

Create `apps/extension/src/extension.ts`:

```ts
import * as vscode from "vscode";
import { openAgentPanel } from "./panel.js";

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand("aiIdeAgent.openPanel", async () => {
    await openAgentPanel(vscode);
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  return undefined;
}
```

- [ ] **Step 8: Run extension test**

Run:

```bash
npx vitest run apps/extension/test/extension.test.ts
```

Expected: PASS.

- [ ] **Step 9: Build extension**

Run:

```bash
npm run build -w ai-ide-agent-extension
```

Expected: `apps/extension/dist/extension.js` is generated.

- [ ] **Step 10: Commit extension shell**

```bash
git add apps/extension
git commit -m "feat: add VS Code extension shell"
```

## Task 8: Add Open-Source Documentation

**Files:**

- Create: `README.md`
- Create: `docs/providers/adapter-guide.md`
- Create: `docs/contributors/development.md`

- [ ] **Step 1: Create README**

Create `README.md`:

```md
# AI IDE Agent

AI IDE Agent is an open-source, local-first IDE agent platform for bringing third-party LLMs into a trustworthy software engineering workflow.

Positioning: **From Prompt to Proof.**

The project starts as a VS Code-compatible extension plus reusable local Agent Core. The long-term roadmap keeps the core editor-independent so it can later power a CLI, desktop IDE, or other editor integrations.

## Phase 1 Features

- TypeScript monorepo
- VS Code-compatible extension shell
- Local Agent Core lifecycle
- Provider adapter contract
- Mock provider
- OpenAI-compatible provider adapter
- Minimax, Kimi, and GLM provider presets
- Context Ledger model
- Task Spec model
- Change Capsule model
- Verification evidence model
- Local project storage
- CLI demo

## Quick Start

```bash
npm install
npm test
npm run build
npm run demo
```

## Architecture

```text
apps/extension
  -> packages/agent-core
       -> packages/protocol
       -> packages/providers
       -> packages/storage
```

## Local-First Policy

Source code stays in the local workspace. API keys should be stored through editor or OS secret storage. Long-term memory stores references, summaries, and provenance instead of copying source files by default.

## Roadmap

- Full Context Ledger UI
- Provider settings UI
- Real diff preview and Change Capsules
- Verification runners
- Debug Hypothesis Mode
- Memory Update Proposal UI
- Budget and limits console
- Standalone desktop IDE exploration
```

- [ ] **Step 2: Create provider adapter guide**

Create `docs/providers/adapter-guide.md`:

```md
# Provider Adapter Guide

Provider adapters let Agent Core use different LLM providers through one contract.

Every adapter must implement `ModelProvider` from `@ai-ide-agent/providers`:

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

Rules:

- Keep vendor SDK details inside the adapter.
- Declare model capabilities explicitly.
- Do not persist API keys in project files.
- Add tests that run without real provider credentials.
- Put live provider tests behind explicit environment variables.

Phase 1 includes:

- Mock provider for deterministic tests
- OpenAI-compatible provider for providers that expose `/chat/completions`
- Presets for Minimax, Kimi, and GLM using OpenAI-compatible chat completion semantics
```

- [ ] **Step 3: Create contributor development guide**

Create `docs/contributors/development.md`:

```md
# Development Guide

## Setup

```bash
npm install
```

## Common Commands

```bash
npm test
npm run typecheck
npm run build
npm run demo
```

## Package Boundaries

- `packages/protocol`: shared types only
- `packages/providers`: LLM adapter contract and adapters
- `packages/storage`: local persistence
- `packages/agent-core`: lifecycle orchestration
- `packages/cli`: contributor-facing local demo
- `apps/extension`: VS Code-compatible shell

## Testing Rules

Write failing tests before implementation. Provider tests must pass without real API keys by default. Agent Core tests should use the mock provider unless a live provider test is explicitly requested.

## Local Data

Runtime local data is written to `.ai-ide-agent/`, which is ignored by Git.
```

- [ ] **Step 4: Commit docs**

```bash
git add README.md docs/providers/adapter-guide.md docs/contributors/development.md
git commit -m "docs: add open-source project guides"
```

## Task 9: Final Verification

**Files:**

- Modify: `package.json` if scripts need path fixes after implementation

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: TypeScript reports no errors.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: every package builds.

- [ ] **Step 4: Run CLI demo**

Run:

```bash
npm run demo
```

Expected: JSON output includes `contextLedger`, `taskSpec`, `changeCapsules`, `verification`, and `memoryProposal`.

- [ ] **Step 5: Check Git diff**

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` prints no whitespace errors. `git status --short` only shows intentional files before the final commit.

- [ ] **Step 6: Commit final verification fixes if needed**

If any script path or package metadata fix was required, commit it:

```bash
git add package.json package-lock.json apps packages docs README.md .gitignore .vscodeignore tsconfig.base.json vitest.config.ts
git commit -m "chore: verify phase 1 workspace"
```

## Self-Review

Spec coverage:

- VS Code-compatible extension shell: Task 7.
- Local Agent Core: Task 5.
- Provider API and mainstream model adapter path, including Minimax, Kimi, and GLM presets: Task 3.
- Context Ledger, Task Spec, Change Capsules, Verification Evidence, Memory Proposal models: Task 2 and Task 5.
- Local-first storage: Task 4.
- CLI demo for contributor testing: Task 6.
- Open-source docs: Task 8.
- Verification commands: Task 9.

Intentional Phase 1 gaps for later plans:

- Real provider settings UI.
- Real diff application.
- Full file scanning and indexing.
- Full Debug Hypothesis Mode.
- Verification runner execution engine.
- Rich Memory panel.
- Budget console UI.
- Marketplace packaging.

Placeholder scan:

- No open placeholders are intended in this plan.
- Later-phase gaps are named explicitly above and are not part of Phase 1 acceptance.

Type consistency:

- `TaskRequest`, `TaskLifecycle`, `TaskState`, `ChatRequest`, `ProviderCapabilities`, and provider method names match across protocol, providers, storage, agent-core, CLI, and extension tasks.
