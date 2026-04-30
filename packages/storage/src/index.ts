import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
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

export interface ContextArchiveInput {
  taskId: string;
  goal: string;
  summary: string;
  paths: string[];
  facts: string[];
  rules: string[];
  decisions: string[];
  pitfalls: string[];
}

export interface ContextArchiveRecord extends ContextArchiveInput {
  createdAt: string;
}

export interface RetrievedContextArchiveRecord extends ContextArchiveRecord {
  score: number;
}

const CONTEXT_ARCHIVE_FILE = "context-archive.jsonl";

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter((token) => token.length >= 3);
}

function archiveText(record: ContextArchiveRecord): string {
  return [
    record.goal,
    record.summary,
    ...record.paths,
    ...record.facts,
    ...record.rules,
    ...record.decisions,
    ...record.pitfalls
  ].join(" ");
}

function archiveScore(queryTokens: string[], record: ContextArchiveRecord): number {
  const haystack = new Set(tokenize(archiveText(record)));
  return queryTokens.reduce((score, token) => score + (haystack.has(token) ? 1 : 0), 0);
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

  async appendContextArchive(record: ContextArchiveInput): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await appendFile(
      join(this.dataDir, CONTEXT_ARCHIVE_FILE),
      `${JSON.stringify({ ...record, createdAt: new Date().toISOString() })}\n`,
      "utf8"
    );
  }

  async readContextArchive(): Promise<ContextArchiveRecord[]> {
    try {
      const raw = await readFile(join(this.dataDir, CONTEXT_ARCHIVE_FILE), "utf8");
      return raw
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as ContextArchiveRecord);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  async searchContextArchive(query: string, limit = 5): Promise<RetrievedContextArchiveRecord[]> {
    const queryTokens = Array.from(new Set(tokenize(query)));
    if (queryTokens.length === 0) {
      return [];
    }

    const records = await this.readContextArchive();
    return records
      .map((record) => ({
        ...record,
        score: archiveScore(queryTokens, record)
      }))
      .filter((record) => record.score > 0)
      .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
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
