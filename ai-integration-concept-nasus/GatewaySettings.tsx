/**
 * GatewaySettings — Settings panel section for LLM gateway configuration.
 *
 * Provides:
 * - Gateway list with enable/disable toggles
 * - API key input per gateway
 * - Test Connection button with live latency feedback
 * - Routing mode selector (Auto Free / Auto Paid / Manual)
 * - Model picker for manual mode
 * - Gateway health indicators
 *
 * Usage in SettingsPanel:
 *   import { GatewaySettings } from './GatewaySettings'
 *   // Inside your settings JSX:
 *   <GatewaySettings />
 */

import { useState, useCallback } from 'react'
import { useAppStore } from '../../store'
import type { GatewayConfig, RoutingMode, GatewayType } from '../gateway/gatewayTypes'
import { requiresApiKey } from '../gateway/gatewayTypes'
import { getModelsForGateway, getFreeModels } from '../gateway/modelRegistry'

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: '#22c55e',
    degraded: '#eab308',
    down: '#ef4444',
    unknown: '#6b7280',
    testing: '#3b82f6',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: colors[status] ?? colors.unknown,
        marginRight: 6,
      }}
    />
  )
}

function GatewayRow({
  gateway,
  health,
  onUpdate,
  onTest,
  isTesting,
  testResult,
}: {
  gateway: GatewayConfig
  health?: { status: string; avgLatencyMs: number; successRate: number }
  onUpdate: (id: string, updates: Partial<GatewayConfig>) => void
  onTest: (id: string) => void
  isTesting: boolean
  testResult?: { ok: boolean; latencyMs: number; error?: string; modelCount?: number }
}) {
  const [showKey, setShowKey] = useState(false)
  const needsKey = requiresApiKey(gateway.type)

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 8,
        border: '1px solid var(--border-secondary, #2a2a2a)',
        backgroundColor: gateway.enabled
          ? 'var(--bg-elevated, #1a1a1a)'
          : 'var(--bg-muted, #111)',
        opacity: gateway.enabled ? 1 : 0.6,
        transition: 'all 0.15s ease',
        marginBottom: 8,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: needsKey ? 8 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status={isTesting ? 'testing' : health?.status ?? 'unknown'} />
          <span style={{ fontWeight: 500, fontSize: 13 }}>{gateway.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary, #666)', fontFamily: 'monospace' }}>
            {gateway.type}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {health && health.status === 'healthy' && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary, #666)' }}>
              {Math.round(health.avgLatencyMs)}ms
            </span>
          )}

          <button
            onClick={() => onTest(gateway.id)}
            disabled={isTesting || !gateway.enabled}
            style={{
              fontSize: 11,
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid var(--border-secondary, #333)',
              background: 'transparent',
              color: 'var(--text-secondary, #999)',
              cursor: isTesting || !gateway.enabled ? 'not-allowed' : 'pointer',
            }}
          >
            {isTesting ? 'Testing…' : 'Test'}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={gateway.enabled}
              onChange={(e) => onUpdate(gateway.id, { enabled: e.target.checked })}
            />
          </label>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div
          style={{
            fontSize: 11,
            padding: '4px 8px',
            marginBottom: 8,
            borderRadius: 4,
            backgroundColor: testResult.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: testResult.ok ? '#22c55e' : '#ef4444',
          }}
        >
          {testResult.ok
            ? `Connected — ${testResult.latencyMs}ms${testResult.modelCount ? `, ${testResult.modelCount} models` : ''}`
            : `Failed: ${testResult.error}`}
        </div>
      )}

      {/* API Key input */}
      {needsKey && gateway.enabled && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={gateway.apiKey}
            onChange={(e) => onUpdate(gateway.id, { apiKey: e.target.value })}
            placeholder={`${gateway.label} API Key`}
            style={{
              flex: 1,
              fontSize: 12,
              padding: '5px 8px',
              borderRadius: 4,
              border: '1px solid var(--border-secondary, #333)',
              background: 'var(--bg-primary, #0a0a0a)',
              color: 'var(--text-primary, #e5e5e5)',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              fontSize: 10,
              padding: '5px 6px',
              borderRadius: 4,
              border: '1px solid var(--border-secondary, #333)',
              background: 'transparent',
              color: 'var(--text-tertiary, #666)',
              cursor: 'pointer',
              minWidth: 32,
            }}
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
      )}

      {/* Custom URL for LiteLLM/Ollama/Custom */}
      {gateway.enabled && (gateway.type === 'litellm' || gateway.type === 'ollama' || gateway.type === 'custom') && (
        <div style={{ marginTop: 6 }}>
          <input
            type="text"
            value={gateway.apiBase}
            onChange={(e) => onUpdate(gateway.id, { apiBase: e.target.value })}
            placeholder="Base URL (e.g., http://localhost:4000/v1)"
            style={{
              width: '100%',
              fontSize: 12,
              padding: '5px 8px',
              borderRadius: 4,
              border: '1px solid var(--border-secondary, #333)',
              background: 'var(--bg-primary, #0a0a0a)',
              color: 'var(--text-primary, #e5e5e5)',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GatewaySettings() {
  const gateways = useAppStore((s) => s.gateways)
  const routingMode = useAppStore((s) => s.routingMode)
  const manualModelId = useAppStore((s) => s.manualModelId)
  const gatewayHealth = useAppStore((s) => s.gatewayHealth)
  const updateGateway = useAppStore((s) => s.updateGateway)
  const setRoutingMode = useAppStore((s) => s.setRoutingMode)
  const setManualModel = useAppStore((s) => s.setManualModel)
  const checkGatewayHealth = useAppStore((s) => s.checkGatewayHealth)
  const saveGatewayConfig = useAppStore((s) => s.saveGatewayConfig)

  const [testingGateway, setTestingGateway] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; latencyMs: number; error?: string; modelCount?: number }>>({})

  const handleTest = useCallback(async (id: string) => {
    setTestingGateway(id)
    setTestResults((prev) => ({ ...prev, [id]: undefined as never }))
    try {
      const result = await checkGatewayHealth(id)
      setTestResults((prev) => ({ ...prev, [id]: result }))
    } finally {
      setTestingGateway(null)
    }
  }, [checkGatewayHealth])

  const handleSave = useCallback(() => {
    saveGatewayConfig()
  }, [saveGatewayConfig])

  // Get models for the primary enabled gateway
  const primaryGateway = gateways.find((g) => g.enabled)
  const primaryType: GatewayType = (primaryGateway?.type ?? 'openrouter') as GatewayType
  const availableModels = getModelsForGateway(primaryType)
  const freeModels = getFreeModels(primaryType)

  const healthMap = Object.fromEntries(
    gatewayHealth.map((h) => [h.gatewayId, h]),
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Section: Gateways */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e5e5e5)' }}>
            LLM Gateways
          </h3>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary, #666)' }}>
            {gateways.filter((g) => g.enabled).length} active
          </span>
        </div>
        <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--text-tertiary, #666)', lineHeight: 1.4 }}>
          Gateways are tried in priority order. If one fails, Nasus automatically falls back to the next.
        </p>

        {gateways.map((gw) => (
          <GatewayRow
            key={gw.id}
            gateway={gw}
            health={healthMap[gw.id]}
            onUpdate={updateGateway}
            onTest={handleTest}
            isTesting={testingGateway === gw.id}
            testResult={testResults[gw.id]}
          />
        ))}
      </div>

      {/* Section: Routing Mode */}
      <div>
        <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e5e5e5)' }}>
          Routing Mode
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {([
            { mode: 'auto-free' as RoutingMode, label: 'Auto Free', desc: `Best free model (${freeModels.length} available on ${primaryGateway?.label ?? 'none'})` },
            { mode: 'auto-paid' as RoutingMode, label: 'Auto Paid', desc: 'Best model for the task, optimized for cost' },
            { mode: 'manual' as RoutingMode, label: 'Manual', desc: 'Choose a specific model' },
          ]).map(({ mode, label, desc }) => (
            <label
              key={mode}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${routingMode === mode ? 'var(--accent, #3b82f6)' : 'var(--border-secondary, #2a2a2a)'}`,
                backgroundColor: routingMode === mode ? 'rgba(59,130,246,0.06)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
            >
              <input
                type="radio"
                name="routingMode"
                value={mode}
                checked={routingMode === mode}
                onChange={() => setRoutingMode(mode)}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary, #e5e5e5)' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary, #666)', marginTop: 1 }}>{desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Section: Model Picker (only for manual mode) */}
      {routingMode === 'manual' && (
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #e5e5e5)' }}>
            Model
          </h3>
          <select
            value={manualModelId}
            onChange={(e) => setManualModel(e.target.value)}
            style={{
              width: '100%',
              fontSize: 12,
              padding: '6px 8px',
              borderRadius: 4,
              border: '1px solid var(--border-secondary, #333)',
              background: 'var(--bg-primary, #0a0a0a)',
              color: 'var(--text-primary, #e5e5e5)',
              boxSizing: 'border-box',
            }}
          >
            <option value="">Select a model…</option>
            {availableModels.map((m) => {
              const id = m.ids[primaryType]
              const isFree = m.freeOn[primaryType]
              const cost = m.inputCostPer1M === 0 ? 'Free' : `$${m.inputCostPer1M}/$${m.outputCostPer1M} per 1M`
              return (
                <option key={id} value={id}>
                  {m.canonicalName} — {cost}{isFree ? ' ★' : ''} — {(m.contextWindow / 1000).toFixed(0)}k ctx
                </option>
              )
            })}
          </select>

          {/* Custom model ID input */}
          <div style={{ marginTop: 6 }}>
            <input
              type="text"
              value={manualModelId}
              onChange={(e) => setManualModel(e.target.value)}
              placeholder="Or paste a model ID (e.g., anthropic/claude-sonnet-4-20250514)"
              style={{
                width: '100%',
                fontSize: 11,
                padding: '5px 8px',
                borderRadius: 4,
                border: '1px solid var(--border-secondary, #333)',
                background: 'var(--bg-primary, #0a0a0a)',
                color: 'var(--text-secondary, #999)',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        style={{
          padding: '8px 16px',
          borderRadius: 6,
          border: 'none',
          background: 'var(--accent, #3b82f6)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        Save Configuration
      </button>
    </div>
  )
}
