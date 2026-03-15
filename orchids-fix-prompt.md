# Nasus: Fix Three Remaining Gateway Integration Gaps

## Context

The DeepSeek-primary + Anthropic-fallback gateway system is fully wired in TypeScript. Three bugs remain — all in the Rust/TypeScript boundary around gateway defaults and Anthropic auth headers.

---

## Bug 1 — Critical: Fresh Install Silently Disables DeepSeek

**File:** `src-tauri/src/gateway.rs` — `default_gateways()` function

On a fresh install, `loadGatewayConfig()` calls `get_gateways`, which returns Rust's `default_gateways()` when no config is saved. TypeScript merges those Rust defaults over its `DEFAULT_GATEWAYS` by gateway `id`. The Rust list currently has DeepSeek at `enabled: false, priority: 5` — the merge **overwrites TypeScript's `enabled: true, priority: 0`**, silently disabling DeepSeek on first launch.

Current Rust `default_gateways()` (wrong):
```
OpenRouter  priority 0, enabled: true   ← wrong primary
Requesty    priority 1, disabled
DeepSeek    priority 5, enabled: false  ← BUG: disables the intended primary
Anthropic   priority 5, enabled: false  ← priority collision with DeepSeek above
Ollama      priority 10, disabled
LiteLLM     priority 15, disabled
```

**Fix — replace `default_gateways()` to mirror TypeScript `DEFAULT_GATEWAYS` exactly:**

```rust
pub fn default_gateways() -> Vec<GatewayConfig> {
    vec![
        GatewayConfig {
            id: "deepseek".to_string(),
            gateway_type: GatewayType::Deepseek,
            label: "DeepSeek (Direct)".to_string(),
            api_base: "https://api.deepseek.com/v1".to_string(),
            api_key: String::new(),
            priority: 0,
            enabled: true,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        },
        GatewayConfig {
            id: "anthropic".to_string(),
            gateway_type: GatewayType::Anthropic,
            label: "Anthropic (Claude)".to_string(),
            api_base: "https://api.anthropic.com/v1".to_string(),
            api_key: String::new(),
            priority: 5,
            enabled: false,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        },
        GatewayConfig {
            id: "ollama".to_string(),
            gateway_type: GatewayType::Ollama,
            label: "Ollama (Local)".to_string(),
            api_base: "http://localhost:11434/v1".to_string(),
            api_key: String::new(),
            priority: 10,
            enabled: false,
            native_routing: false,
            max_retries: 1,
            timeout_ms: 300_000,
            extra_headers: HashMap::new(),
        },
        GatewayConfig {
            id: "custom".to_string(),
            gateway_type: GatewayType::Custom,
            label: "Custom".to_string(),
            api_base: String::new(),
            api_key: String::new(),
            priority: 20,
            enabled: false,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        },
    ]
}
```

Also update `GatewayConfig::default()` to match the new primary:

```rust
impl Default for GatewayConfig {
    fn default() -> Self {
        Self {
            id: "deepseek".to_string(),
            gateway_type: GatewayType::Deepseek,
            label: "DeepSeek (Direct)".to_string(),
            api_base: "https://api.deepseek.com/v1".to_string(),
            api_key: String::new(),
            priority: 0,
            enabled: true,
            native_routing: false,
            max_retries: 2,
            timeout_ms: 180_000,
            extra_headers: HashMap::new(),
        }
    }
}
```

**Regarding the removed variants (Openrouter, Requesty, Vercel, Litellm):** Before removing them from the enum, check `build_headers()` — it matches on `GatewayType::Openrouter | GatewayType::Requesty` and `GatewayType::Vercel`. Keep the enum variants to avoid compile errors; just remove their entries from `default_gateways()`.

---

## Bug 2 — Anthropic "Test Connection" always fails in TypeScript

**File:** `src/agent/gateway/gatewayService.ts` — `healthCheck()` method

The GatewaySettings "Test Connection" button calls `checkGatewayHealth(id)` → `gatewayService.healthCheck(id)`, which hits `<apiBase>/models` using `Authorization: Bearer <key>`. Anthropic's API does **not** accept `Authorization: Bearer` — it requires `x-api-key: <key>` plus `anthropic-version: 2023-06-01`. Every test attempt on the Anthropic gateway returns a false 401 failure.

Find the `healthCheck()` method. The current header-building block looks like this:

```typescript
const headers: Record<string, string> = { 'Content-Type': 'application/json' }
if (gw.apiKey) headers['Authorization'] = `Bearer ${gw.apiKey}`
Object.assign(headers, gw.extraHeaders ?? {})
```

**Fix — detect Anthropic type and use the correct auth scheme:**

```typescript
const headers: Record<string, string> = { 'Content-Type': 'application/json' }

if (gw.type === 'anthropic') {
  if (gw.apiKey) headers['x-api-key'] = gw.apiKey
  headers['anthropic-version'] = '2023-06-01'
} else {
  if (gw.apiKey) headers['Authorization'] = `Bearer ${gw.apiKey}`
}

Object.assign(headers, gw.extraHeaders ?? {})
```

`GatewayConfig` already has `type: GatewayType`, so `gw.type === 'anthropic'` is valid.

---

## Bug 3 — Anthropic "Test Connection" also fails in Rust

**File:** `src-tauri/src/gateway.rs` — `test_gateway` async command

The Rust `test_gateway` command (invoked when the frontend calls `tauriInvoke('test_gateway', ...)`) has the same auth problem:

```rust
if !api_key.is_empty() {
    req = req.header("Authorization", format!("Bearer {api_key}"));
}
```

**Fix — check the base URL and switch to `x-api-key` for Anthropic:**

```rust
if !api_key.is_empty() {
    if api_base.contains("api.anthropic.com") {
        req = req
            .header("x-api-key", &api_key)
            .header("anthropic-version", "2023-06-01");
    } else {
        req = req.header("Authorization", format!("Bearer {api_key}"));
    }
}
```

---

## Summary

| # | File | Root cause | Fix |
|---|------|-----------|-----|
| 1 | `src-tauri/src/gateway.rs` `default_gateways()` | DeepSeek `enabled:false, priority:5` overwrites TS `enabled:true` on fresh install | Replace with [DeepSeek p0 enabled, Anthropic p5, Ollama p10, Custom p20] |
| 2 | `src/agent/gateway/gatewayService.ts` `healthCheck()` | Uses `Authorization: Bearer` — Anthropic rejects it | `if gw.type === 'anthropic'` → use `x-api-key` + `anthropic-version` |
| 3 | `src-tauri/src/gateway.rs` `test_gateway` | Same auth header problem in Rust | `if api_base.contains("api.anthropic.com")` → use `x-api-key` |

---

## Do Not Touch

- `src/agent/gateway/gatewayTypes.ts` — TypeScript defaults correct
- `src/agent/gateway/provider.ts` — `createAnthropic()` handles auth internally
- `src/agent/gateway/gatewayStore.ts` — merge logic correct
- `src/store/settingsSlice.ts` — fixed
- All UI components — correct

---

## Verification

```bash
npm run build          # TypeScript zero errors
cargo build            # Rust compiles clean (run from src-tauri/)
```

Fresh-install simulation:
1. Delete the app's `nasus_config.json` from the Tauri app data directory
2. Launch — DeepSeek should appear **enabled** with "Primary" badge in Settings → Gateway
3. Enter a valid DeepSeek key → Test Connection → green ✓ with latency ms
4. Enter a valid Anthropic key → Test Connection → green ✓ (not a 401)
5. Both set: "Primary" on DeepSeek, "Fallback" on Anthropic
6. Send a message → sidebar footer shows "DeepSeek · deepseek-chat"
