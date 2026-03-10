/**
 * CallNasusAgentTool.ts
 * Place at: src/agent/tools/core/CallNasusAgentTool.ts
 * Phase 7 -- Nasus Stack Tauri integration glue.
 */

const NASUS_BASE_URL = "http://127.0.0.1:4751";
const POLL_INTERVAL_MS = 300;
const POLL_TIMEOUT_MS = 120_000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NasusModuleId = "M00" | "M01" | "M02" | "M03" | "M04" | "M05"
  | "M06" | "M07" | "M08" | "M09" | "M10" | "M11";

export interface NasusEnvelopeRequest {
  module_id: NasusModuleId;
  payload?: Record<string, unknown>;
  job_id?: string;
}

export interface NasusJobStatus {
  job_id: string;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  module_id: string;
  payload?: unknown;
  errors: string[];
  created_at: string;
  updated_at?: string;
}

export interface NasusTaskResult {
  job_id: string;
  status: string;
  payload: unknown;
  errors: string[];
  duration_ms: number;
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

async function submitTask(req: NasusEnvelopeRequest): Promise<{ job_id: string }> {
  const resp = await fetch(`${NASUS_BASE_URL}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!resp.ok) throw new Error(`Nasus submitTask failed (${resp.status}): ${await resp.text()}`);
  return resp.json();
}

async function pollStatus(jobId: string): Promise<NasusJobStatus> {
  const resp = await fetch(`${NASUS_BASE_URL}/task/${jobId}/status`);
  if (!resp.ok) throw new Error(`Nasus status poll failed (${resp.status})`);
  return resp.json();
}

async function cancelTask(jobId: string): Promise<void> {
  await fetch(`${NASUS_BASE_URL}/task/${jobId}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// SSE stream helper
// ---------------------------------------------------------------------------

export async function streamJobLogs(
  jobId: string,
  onLog: (line: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const resp = await fetch(`${NASUS_BASE_URL}/task/${jobId}/stream`, { signal });
  if (!resp.body) return;
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.log) onLog(data.log);
          if (data.done) return;
        } catch { /* ignore malformed SSE */ }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Main execute function
// ---------------------------------------------------------------------------

export async function callNasusAgent(
  req: NasusEnvelopeRequest,
  options?: { onLog?: (line: string) => void; timeoutMs?: number }
): Promise<NasusTaskResult> {
  const startMs = Date.now();
  const timeout = options?.timeoutMs ?? POLL_TIMEOUT_MS;

  const { job_id } = await submitTask(req);

  while (true) {
    if (Date.now() - startMs > timeout) {
      await cancelTask(job_id);
      throw new Error(`Nasus job ${job_id} timed out after ${timeout}ms`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const status = await pollStatus(job_id);
    if (options?.onLog && status.status === "RUNNING") {
      options.onLog(`[${job_id}] status=RUNNING`);
    }
    if (status.status === "DONE" || status.status === "FAILED") {
      return {
        job_id,
        status: status.status,
        payload: status.payload ?? null,
        errors: status.errors ?? [],
        duration_ms: Date.now() - startMs,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// The canonical NasusAgentTool registration (with readiness guard) lives in
// src/agent/tools/index.ts as NasusAgentTool extends BaseTool.
// This file provides only the shared transport helpers used by that class.
// ---------------------------------------------------------------------------
