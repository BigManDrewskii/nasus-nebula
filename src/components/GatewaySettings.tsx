import React, { useState, useCallback } from 'react'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { Pxi } from './Pxi'
import ConfirmModal from './ConfirmModal'
import type { GatewayConfig, GatewayHealth } from '../agent/gateway/gatewayTypes'
import { tauriInvoke } from '../tauri'

/** Serialize GatewayConfig to what the Rust `save_gateways` command expects.
 *  The Rust struct uses `gateway_type` (camelCase: `gatewayType`) but our TS type uses `type`.
 */
function serializeGateway(g: GatewayConfig): Record<string, unknown> {
  const { type, ...rest } = g as GatewayConfig & { type: string }
  return { ...rest, gatewayType: type }
}

/** Persist all current gateways to the Tauri secure store (fire-and-forget). */
async function persistGateways() {
  try {
    const gateways = useAppStore.getState().gateways
    await tauriInvoke('save_gateways', { gateways: gateways.map(serializeGateway) })
  } catch { /* non-fatal in browser mode */ }
}

export function GatewaySettings() {
  const { gateways, updateGateway, addGateway, removeGateway, checkGatewayHealth, gatewayHealth } = useAppStore(useShallow(s => ({
    gateways: s.gateways,
    updateGateway: s.updateGateway,
    addGateway: s.addGateway,
    removeGateway: s.removeGateway,
    checkGatewayHealth: s.checkGatewayHealth,
    gatewayHealth: s.gatewayHealth,
  })))
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleUpdate = useCallback((id: string, updates: Partial<GatewayConfig>) => {
    updateGateway(id, updates)
    persistGateways()
  }, [updateGateway])

  const handleRemove = useCallback((id: string) => {
    removeGateway(id)
    persistGateways()
  }, [removeGateway])

  return (
    <div className="flex-col gw-root">
      <div className="flex-v-center justify-between gw-header">
        <label className="flex-v-center settings-label text-secondary">
          <Pxi name="microchip" size={12} className="text-tertiary" />
          LLM Gateways
        </label>
        <span className="text-muted gw-active-count">
          {gateways.filter(g => g.enabled).length} active
        </span>
      </div>

      <div className="flex-col gw-list">
        {[...gateways].sort((a, b) => a.priority - b.priority).map((gw) => (
            <GatewayItem
              key={gw.id}
              gateway={gw}
              health={gatewayHealth.find(h => h.gatewayId === gw.id)}
              isExpanded={expandedId === gw.id}
              onToggleExpand={() => setExpandedId(expandedId === gw.id ? null : gw.id)}
              onUpdate={(updates) => handleUpdate(gw.id, updates)}
              onRemove={() => handleRemove(gw.id)}
              onTest={() => checkGatewayHealth(gw.id)}
            />
          ))}
        </div>

        <button
          onClick={() => {
            const id = `custom-${Math.random().toString(36).slice(2, 7)}`
            addGateway({
              id,
              type: 'custom',
              label: 'New Gateway',
              apiBase: '',
              apiKey: '',
              priority: 20,
              enabled: true,
              nativeRouting: false,
              maxRetries: 2,
              timeoutMs: 180_000,
            })
            setExpandedId(id)
            persistGateways()
          }}
        className="text-secondary gw-add-btn hover-bg-app-3"
      >
        + Add Custom Gateway
      </button>

      <GatewayHealthDashboard health={gatewayHealth} />
    </div>
  )
}

function GatewayHealthDashboard({ health }: { health: GatewayHealth[] }) {
  if (health.length === 0) return null

  return (
    <div className="flex-col gw-health-dashboard">
      <div className="flex-v-center gw-health-title-row">
        <Pxi name="activity" size={12} className="text-tertiary" />
        <span className="text-secondary gw-health-title">Real-time Health</span>
      </div>

      <div className="flex-col gw-health-list">
        {health.map((h) => {
          const statusColors: Record<string, string> = { healthy: '#22c55e', degraded: '#eab308', down: '#ef4444', unknown: '#94a3b8' }
          const color = statusColors[h.status] || '#94a3b8'

          return (
            <div key={h.gatewayId} className="flex-col gw-health-item">
              <div className="flex-v-center justify-between">
                <div className="flex-v-center gw-health-left">
                  <div
                    className="gw-health-dot"
                    style={{ background: color, boxShadow: h.status === 'healthy' ? `0 0 6px ${color}40` : 'none' }}
                  />
                  <span className="gw-health-name">{h.gatewayId}</span>
                  <span className="gw-health-status" style={{ color }}>{h.status}</span>
                </div>
                <div className="flex gw-health-stats">
                  <div className="flex-col items-end">
                    <span className="text-muted gw-stat-label">Latency</span>
                    <span className="text-secondary font-mono gw-stat-value">{h.avgLatencyMs > 0 ? `${Math.round(h.avgLatencyMs)}ms` : '—'}</span>
                  </div>
                  <div className="flex-col items-end">
                    <span className="text-muted gw-stat-label">Success</span>
                    <span className="text-secondary font-mono gw-stat-value">{Math.round(h.successRate * 100)}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gw-health-meta">
                <div className="flex-v-center gw-meta-item">
                  <span className="text-tertiary gw-meta-label">Requests:</span>
                  <span className="text-secondary font-mono gw-meta-value">{h.requestCount || 0}</span>
                </div>
                {h.lastChecked > 0 && (
                  <div className="flex-v-center gw-meta-item">
                    <span className="text-tertiary gw-meta-label">Last:</span>
                    <span className="text-secondary font-mono gw-meta-value">{new Date(h.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                )}
                {h.status === 'down' && h.retryAfter && (
                  <div className="flex-v-center gw-meta-item">
                    <span className="gw-meta-label" style={{ color: '#ef4444' }}>Retry in:</span>
                    <span className="font-mono gw-meta-value" style={{ color: '#ef4444' }}>{Math.ceil((h.retryAfter - Date.now()) / 1000)}s</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GatewayItem({
  gateway, health, isExpanded, onToggleExpand, onUpdate, onRemove, onTest
}: {
  gateway: GatewayConfig,
  health?: GatewayHealth,
  isExpanded: boolean,
  onToggleExpand: () => void,
  onUpdate: (updates: Partial<GatewayConfig>) => void,
  onRemove: () => void,
  onTest: () => Promise<{ ok: boolean; latencyMs?: number; error?: string }>
}) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean, latencyMs?: number, error?: string } | null>(null)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const handleTest = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setTesting(true)
    setTestResult(null)
    try {
      const res = await onTest()
      setTestResult(res)
    } catch (err) {
      setTestResult({ ok: false, error: String(err) })
    } finally {
      setTesting(false)
    }
  }

  const getStatusColor = () => {
    if (!gateway.enabled) return 'var(--tx-muted)'
    if (!health) return '#94a3b8'
    if (health.status === 'healthy') return '#22c55e'
    if (health.status === 'degraded') return '#eab308'
    if (health.status === 'down') return '#ef4444'
    return '#94a3b8'
  }

  return (
    <>
      <div
        className="gw-item"
        style={{
          background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
      {/* Header */}
      <div onClick={onToggleExpand} className="flex-v-center gw-item-header">
        <div
          className="gw-status-dot"
          style={{
            background: getStatusColor(),
            boxShadow: gateway.enabled && health?.status === 'healthy' ? '0 0 8px #22c55e40' : 'none',
          }}
          title={health?.status ?? 'Unknown'}
        />

        <div className="flex-1 flex-col gw-item-info">
          <div className="flex-v-center gw-item-name-row">
            <span
              className="gw-item-name"
              style={{ color: gateway.enabled ? 'var(--tx-primary)' : 'var(--tx-tertiary)' }}
            >
              {gateway.label}
            </span>
            <span className="gw-item-type-badge">{gateway.type}</span>
          </div>
          <span className="text-tertiary gw-item-base truncate">{gateway.apiBase}</span>
        </div>

        <div className="flex-v-center gw-item-controls">
          {health != null && health.avgLatencyMs > 0 && (
            <span className="text-muted gw-latency">{Math.round(health.avgLatencyMs)}ms</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ enabled: !gateway.enabled }) }}
            className="gw-toggle"
            style={{ background: gateway.enabled ? 'var(--amber)' : 'rgba(255,255,255,0.1)' }}
          >
            <span
              className="gw-toggle-thumb"
              style={{ left: gateway.enabled ? 16 : 2 }}
            />
          </button>
          <Pxi name={isExpanded ? 'chevron-up' : 'chevron-down'} size={12} className="text-tertiary" />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="flex-col gw-item-body">
          <div className="flex gw-item-fields">
            <div className="flex-col gw-field gw-field--flex2">
              <label className="text-tertiary gw-field-label">Label</label>
              <input
                type="text"
                value={gateway.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="gw-input"
              />
            </div>
            <div className="flex-col gw-field gw-field--flex1">
              <label className="text-tertiary gw-field-label">Priority</label>
              <input
                type="number"
                value={gateway.priority}
                onChange={(e) => onUpdate({ priority: parseInt(e.target.value) || 0 })}
                className="gw-input"
              />
            </div>
          </div>

          <div className="flex-col gw-field">
            <label className="text-tertiary gw-field-label">API Base URL</label>
            <input
              type="text"
              value={gateway.apiBase}
              onChange={(e) => onUpdate({ apiBase: e.target.value })}
              placeholder="https://..."
              className="gw-input"
            />
          </div>

          <div className="flex-col gw-field">
            <label className="text-tertiary gw-field-label">API Key</label>
            <input
              type="password"
              value={gateway.apiKey}
              onChange={(e) => onUpdate({ apiKey: e.target.value })}
              placeholder={
                gateway.type === 'ollama'   ? 'Not required for local' :
                gateway.type === 'deepseek' ? 'sk-… (from platform.deepseek.com/api-keys)' :
                gateway.type === 'requesty' ? 'req_… (from app.requesty.ai)' :
                'sk-or-v1-…'
              }
              className="gw-input"
            />
            {gateway.type === 'deepseek' && (
              <span className="text-tertiary gw-deepseek-hint">
                Supported models: <code className="font-mono text-secondary">deepseek-chat</code> (V3), <code className="font-mono text-secondary">deepseek-reasoner</code> (R1 / R1-0528)
              </span>
            )}
          </div>

          <div className="flex-v-center justify-between gw-item-footer">
            <div className="flex gw-test-row">
              <button
                onClick={handleTest}
                disabled={testing || !gateway.apiBase}
                className="flex-v-center text-secondary gw-test-btn"
              >
                {testing ? <Pxi name="spinner-third" size={12} className="spin" /> : <Pxi name="vial" size={12} />}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult && (
                <div className="flex-v-center gw-test-result">
                  <Pxi
                    name={testResult.ok ? 'check-circle' : 'circle-xmark'}
                    size={14}
                    style={{ color: testResult.ok ? '#22c55e' : '#ef4444' }}
                  />
                  <span className="gw-test-result-text" style={{ color: testResult.ok ? '#22c55e' : '#ef4444' }}>
                    {testResult.ok ? `${testResult.latencyMs}ms` : testResult.error}
                  </span>
                </div>
              )}
            </div>

              <button
                onClick={(e) => { e.stopPropagation(); setConfirmRemove(true) }}
                className="gw-remove-btn hover-text-red"
              >
                <Pxi name="trash-alt" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmRemove && (
        <ConfirmModal
          title={`Remove ${gateway.label}?`}
          message="This gateway will be removed and cannot be undone."
          confirmLabel="Remove"
          onConfirm={() => { setConfirmRemove(false); onRemove() }}
          onCancel={() => setConfirmRemove(false)}
          danger
          />
        )}
    </>
  )
}
