"use client";

import { Agentation } from "agentation";

/**
 * Visual feedback toolbar for agents (https://agentation.dev).
 *
 * Dev-only: renders nothing unless NODE_ENV === "development", so it never
 * ships to production (the component itself also self-gates, but keeping the
 * check here means the bundle isn't even referenced in a prod build).
 *
 * Connects to the local Agentation MCP server (npx -y agentation-mcp server,
 * default port 4747) when it's running; annotations stay local otherwise and
 * sync when the server is available (local-first).
 */
export function AgentationDev() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <Agentation
      endpoint="http://localhost:4747"
      onSessionCreated={(sessionId) => {
        console.log("[agentation] session started:", sessionId);
      }}
    />
  );
}
