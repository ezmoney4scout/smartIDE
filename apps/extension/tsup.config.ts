import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["esm"],
  external: ["vscode"],
  noExternal: [
    "@ai-ide-agent/agent-core",
    "@ai-ide-agent/providers",
    "@ai-ide-agent/protocol",
    "@ai-ide-agent/storage"
  ],
  tsconfig: "tsconfig.build.json",
  clean: true
});
