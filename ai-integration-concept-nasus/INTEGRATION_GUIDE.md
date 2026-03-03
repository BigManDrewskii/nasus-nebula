# Gateway Integration Guide

## File Placement

```
src/
├── agent/
│   ├── gateway/                    ← NEW MODULE
│   │   ├── index.ts                ← Re-exports
│   │   ├── gatewayTypes.ts         ← Types, defaults, helpers
│   │   ├── gatewayService.ts       ← Failover + circuit breakers
│   │   ├── modelRegistry.ts        ← Model catalog per gateway
│   │   └── gatewayStore.ts         ← Zustand slice
│   ├── agents/
│   │   └── ExecutionAgent.ts       ← MODIFY (use gateway service)
│   └── llm.ts                      ← MODIFY (accept extra headers)
src-tauri/src/
├── gateway.rs                      ← NEW MODULE
├── lib.rs                          ← MODIFY (add gateway state + commands)
```

## Step 1: Add gateway module to TypeScript

Copy the 5 TypeScript files into `src/agent/gateway/`.

## Step 2: Wire into your Zustand store

In your `store.ts`:

```typescript
import { createGatewaySlice, type GatewaySlice } from './agent/gateway'

// Add GatewaySlice to your AppState interface
interface AppState extends GatewaySlice {
  // ... your existing state
}

// Add the slice to the store creator
export const useAppStore = create<AppState>()((...a) => ({
  ...createGatewaySlice(...a),
  // ... your existing slices
}))
```

## Step 3: Initialize on app startup

In your main App component or entry point:

```typescript
useEffect(() => {
  const store = useAppStore.getState()
  store.initGatewayService()
  store.loadGatewayConfig()
}, [])
```

## Step 4: Modify ExecutionAgent.callLLM()

This is the key integration point. Change `callLLM` to use the gateway service:

```typescript
// BEFORE (single gateway):
private async callLLM(
  messages: LlmMessage[],
  model: string,
  apiBase: string,
  apiKey: string,
  provider: string,
  taskId: string,
  messageId: string,
  signal: AbortSignal,
) {
  const result = await streamCompletion(apiBase, apiKey, provider, model, messages, tools, { ... })
}

// AFTER (gateway failover):
private async callLLM(
  messages: LlmMessage[],
  taskId: string,
  messageId: string,
  signal: AbortSignal,
) {
  const service = useAppStore.getState().getGatewayService()
  const { routingMode, manualModelId } = useAppStore.getState()

  const { result } = await service.callWithFailover(
    async (apiBase, apiKey, extraHeaders) => {
      // Resolve model ID for this specific gateway
      const gatewayType = useAppStore.getState().gateways
        .find(g => g.apiBase === apiBase)?.type ?? 'openrouter'
      
      const selection = selectModel(routingMode, gatewayType, manualModelId)
      const model = selection?.modelId ?? manualModelId

      return streamCompletion(apiBase, apiKey, gatewayType, model, messages, tools, {
        onDelta: (delta) => this.emitChunk(taskId, messageId, delta),
        onToolCalls: (calls) => { /* ... */ },
        onUsage: (p, c, t) => this.emitTokenUsage(taskId, p, c, t),
        onError: (err) => this.emitError(taskId, messageId, err),
        signal,
        extraHeaders,  // ← Pass gateway-specific headers to streamCompletion
      })
    }
  )

  return result
}
```

## Step 5: Update streamCompletion to accept extra headers

In your `llm.ts`, add `extraHeaders` to the options:

```typescript
export async function streamCompletion(
  apiBase: string,
  apiKey: string,
  provider: string,
  model: string,
  messages: LlmMessage[],
  tools: ToolDefinition[],
  options: {
    // ... existing options
    extraHeaders?: Record<string, string>  // ← ADD THIS
  },
) {
  // In the fetch call:
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...options.extraHeaders,  // ← Inject gateway headers
  }

  // Remove the hardcoded OpenRouter headers — they now come from the gateway:
  // DELETE: if (provider === 'openrouter') { ... }
}
```

## Step 6: Update ExecutionAgent.execute() entry point

The params interface no longer needs `apiBase`/`apiKey`/`provider`/`model` —
those come from the gateway now:

```typescript
// BEFORE:
const { taskId, messageId, userMessages, apiKey, model, apiBase, provider, signal } = params

// AFTER:
const { taskId, messageId, userMessages, signal } = params
// apiBase, apiKey, model, provider are now resolved per-call by the gateway service
```

But for backward compatibility, keep accepting them as optional overrides:

```typescript
interface ExecutionConfigParams {
  taskId: string
  messageId: string
  userMessages: LlmMessage[]
  signal: AbortSignal
  // Legacy — if provided, bypass gateway and use directly
  apiKey?: string
  model?: string
  apiBase?: string
  provider?: string
  // ... rest
}
```

## Step 7: Rust side — add gateway.rs

Add `mod gateway;` to lib.rs and register the state + commands:

```rust
// In lib.rs, at the top:
mod gateway;
use gateway::{GatewayState, default_gateways};

// In run():
.manage(GatewayState::new(default_gateways()))

// In invoke_handler:
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    gateway::get_gateways,
    gateway::save_gateways,
    gateway::get_gateway_health,
    gateway::test_gateway,
])
```

## Step 8: Update llm_stream in lib.rs (Rust agent loop)

The Rust `run_agent` command should also use the gateway for failover:

```rust
// In run_agent, replace the single llm_stream call with a gateway-aware loop:

let gw_state = app.state::<GatewayState>();
let eligible = {
    let mgr = gw_state.manager.lock().unwrap();
    mgr.eligible().iter().map(|g| (*g).clone()).collect::<Vec<_>>()
};

let mut last_error = String::new();
let mut response = None;

for gw in &eligible {
    let headers = {
        let mgr = gw_state.manager.lock().unwrap();
        mgr.build_headers(gw)
    };

    match llm_stream(
        &http, &app, &gw.api_key, &gw.api_base, &gw.gateway_type_str(),
        &effective_model, &messages, &tools, &task_id, &message_id,
    ).await {
        Ok(r) => {
            let mut mgr = gw_state.manager.lock().unwrap();
            mgr.record_success(&gw.id, 0.0); // TODO: measure latency
            response = Some(r);
            break;
        }
        Err(e) => {
            let mut mgr = gw_state.manager.lock().unwrap();
            mgr.record_failure(&gw.id);
            last_error = e;
            // Emit fallback event
            let _ = app.emit("agent-event", AgentEvent::Thinking {
                task_id: task_id.clone(),
                message_id: message_id.clone(),
                content: format!("Gateway {} failed, trying next…", gw.label),
            });
        }
    }
}

let response = response.ok_or_else(|| format!("All gateways failed: {last_error}"))?;
```

## Migration Strategy

### Phase 1 (Day 1): Non-breaking addition
- Add the gateway module files
- Add the Zustand slice alongside existing state
- Load gateway config from existing `config.json` values
- Everything continues working exactly as before

### Phase 2 (Day 2): Wire callLLM through gateway
- Modify `ExecutionAgent.callLLM()` to use `callWithFailover`
- Modify `streamCompletion` to accept `extraHeaders`
- Test with OpenRouter as the only enabled gateway (should be identical behavior)

### Phase 3 (Day 3): Settings UI
- Add Gateway section to SettingsPanel
- Wire up "Test Connection" button to `checkGatewayHealth`
- Let users add/enable Ollama, LiteLLM, direct providers

### Phase 4 (Day 4): Rust backend parity
- Add `gateway.rs` and wire into `lib.rs`
- Update `run_agent` to use gateway failover
- Ensure both TS and Rust agent loops have the same resilience

### Phase 5 (Ongoing): Polish
- Model registry expansion
- Auto-detection of Ollama (check localhost:11434/v1/models on startup)
- LiteLLM proxy Docker compose template
- Gateway health dashboard in the UI
