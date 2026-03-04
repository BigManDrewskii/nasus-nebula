import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'
import type { GatewayConfig, GatewayType } from '../agent/gateway/gatewayTypes'

export function GatewaySettings() {
  const { gateways, updateGateway, addGateway, removeGateway, checkGatewayHealth, gatewayHealth } = useAppStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-display)',
          textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tx-secondary)',
        }}>
          <Pxi name="microchip" size={10} style={{ color: 'var(--tx-tertiary)' }} />
          LLM Gateways
        </label>
        <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
          {gateways.filter(g => g.enabled).length} active
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {gateways.sort((a, b) => a.priority - b.priority).map((gw) => (
          <GatewayItem
            key={gw.id}
            gateway={gw}
            health={gatewayHealth.find(h => h.gatewayId === gw.id)}
            isExpanded={expandedId === gw.id}
            onToggleExpand={() => setExpandedId(expandedId === gw.id ? null : gw.id)}
            onUpdate={(updates) => updateGateway(gw.id, updates)}
            onRemove={() => removeGateway(gw.id)}
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
        }}
        style={{
          marginTop: 4, padding: '8px', borderRadius: 8, fontSize: 11,
          background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.1)',
          color: 'var(--tx-secondary)', cursor: 'pointer', textAlign: 'center',
          transition: 'all 0.12s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
      >
        + Add Custom Gateway
      </button>

      {/* ── Gateway Health Dashboard ── */}
      <GatewayHealthDashboard health={gatewayHealth} />
    </div>
  )
}

function GatewayHealthDashboard({ health }: { health: any[] }) {
  if (health.length === 0) return null

  return (
    <div style={{
      marginTop: 16, padding: '16px', borderRadius: 12,
      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', gap: 14
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Pxi name="activity" size={10} style={{ color: 'var(--tx-tertiary)' }} />
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--tx-secondary)' }}>
          Real-time Health
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {health.map((h) => {
          const statusColors: Record<string, string> = { healthy: '#22c55e', degraded: '#eab308', down: '#ef4444', unknown: '#94a3b8' }
          const color = statusColors[h.status] || '#94a3b8'
          
          return (
            <div key={h.gatewayId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: h.status === 'healthy' ? `0 0 6px ${color}40` : 'none' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)' }}>{h.gatewayId}</span>
                  <span style={{ fontSize: 10, color: color, textTransform: 'capitalize' }}>{h.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 9, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Latency</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)' }}>{h.avgLatencyMs > 0 ? `${Math.round(h.avgLatencyMs)}ms` : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 9, color: 'var(--tx-muted)', textTransform: 'uppercase' }}>Success</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)' }}>{Math.round(h.successRate * 100)}%</span>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, paddingLeft: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: 'var(--tx-tertiary)' }}>Requests:</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)' }}>{h.requestCount || 0}</span>
                </div>
                {h.lastChecked > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: 'var(--tx-tertiary)' }}>Last:</span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)' }}>{new Date(h.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                )}
                {h.status === 'down' && h.retryAfter && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: '#ef4444' }}>Retry in:</span>
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#ef4444' }}>{Math.ceil((h.retryAfter - Date.now()) / 1000)}s</span>
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
  health?: any,
  isExpanded: boolean,
  onToggleExpand: () => void,
  onUpdate: (updates: Partial<GatewayConfig>) => void,
  onRemove: () => void,
  onTest: () => Promise<any>
}) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean, latencyMs?: number, error?: string } | null>(null)

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
    if (!health) return '#94a3b8' // gray
    if (health.status === 'healthy') return '#22c55e' // green
    if (health.status === 'degraded') return '#eab308' // amber
    if (health.status === 'down') return '#ef4444' // red
    return '#94a3b8'
  }

  return (
    <div style={{
      borderRadius: 12, background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${isExpanded ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
      transition: 'all 0.12s', overflow: 'hidden'
    }}>
      {/* Header */}
      <div
        onClick={onToggleExpand}
        style={{
          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}
      >
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: getStatusColor(),
          boxShadow: gateway.enabled && health?.status === 'healthy' ? '0 0 8px #22c55e40' : 'none',
          flexShrink: 0
        }} title={health?.status ?? 'Unknown'} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: gateway.enabled ? 'var(--tx-primary)' : 'var(--tx-tertiary)' }}>
              {gateway.label}
            </span>
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--tx-muted)', textTransform: 'uppercase' }}>
              {gateway.type}
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gateway.apiBase}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {health?.avgLatencyMs > 0 && (
            <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>{Math.round(health.avgLatencyMs)}ms</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate({ enabled: !gateway.enabled }) }}
            style={{
              width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', position: 'relative',
              background: gateway.enabled ? 'var(--amber)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.15s', padding: 0
            }}
          >
            <span style={{
              position: 'absolute', top: 2, left: gateway.enabled ? 16 : 2,
              width: 14, height: 14, borderRadius: '50%', background: '#fff',
              transition: 'left 0.15s'
            }} />
          </button>
          <Pxi name={isExpanded ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-tertiary)' }} />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{ padding: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--tx-tertiary)', marginLeft: 4 }}>Label</label>
              <input
                type="text"
                value={gateway.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--tx-tertiary)', marginLeft: 4 }}>Priority</label>
              <input
                type="number"
                value={gateway.priority}
                onChange={(e) => onUpdate({ priority: parseInt(e.target.value) || 0 })}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--tx-tertiary)', marginLeft: 4 }}>API Base URL</label>
            <input
              type="text"
              value={gateway.apiBase}
              onChange={(e) => onUpdate({ apiBase: e.target.value })}
              placeholder="https://..."
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: 'var(--tx-tertiary)', marginLeft: 4 }}>API Key</label>
            <input
              type="password"
              value={gateway.apiKey}
              onChange={(e) => onUpdate({ apiKey: e.target.value })}
              placeholder={gateway.type === 'ollama' ? 'Not required for local' : 'sk-or-v1-...'}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleTest}
                disabled={testing || !gateway.apiBase}
                style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--tx-secondary)', cursor: testing ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {testing ? <Pxi name="spinner-third" size={10} className="spin" /> : <Pxi name="vial" size={10} />}
                {testing ? 'Testing...' : 'Test Connection'}
              </button>

              {testResult && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pxi name={testResult.ok ? 'check-circle' : 'circle-xmark'} size={12} style={{ color: testResult.ok ? '#22c55e' : '#ef4444' }} />
                  <span style={{ fontSize: 10, color: testResult.ok ? '#22c55e' : '#ef4444' }}>
                    {testResult.ok ? `${testResult.latencyMs}ms` : testResult.error}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(`Remove ${gateway.label}?`)) onRemove() }}
              style={{
                padding: '6px', borderRadius: 6, background: 'transparent', border: 'none',
                cursor: 'pointer', color: 'rgba(239,68,68,0.6)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(239,68,68,1)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239,68,68,0.6)'}
            >
              <Pxi name="trash-alt" size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 10px', borderRadius: 6, fontSize: 12, outline: 'none',
  color: 'var(--tx-primary)', background: 'rgba(0,0,0,0.3)',
  border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.12s',
}
