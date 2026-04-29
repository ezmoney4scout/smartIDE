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
