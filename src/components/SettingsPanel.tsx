import React, { useState, useRef, useEffect, useMemo } from 'react'
import { FocusTrap } from 'focus-trap-react'
import { tauriInvoke, checkOllama } from '../tauri'
import { fetchOpenRouterModels, formatTokenPrice, type OpenRouterModel } from '../agent/llm'
import { useAppStore } from '../store'
import ConfirmModal from './ConfirmModal'
import { useShallow } from 'zustand/react/shallow'
import { Pxi } from './Pxi'
import { WorkspacePicker } from './WorkspacePicker'
import { isPaidRoute, getRouteLabel } from '../lib/routing'
import { createLogger } from '../lib/logger'

const log = createLogger('SettingsPanel')

// ─── Curated fallback models (shown before user fetches the full list) ─────────

const FALLBACK_MODELS: OpenRouterModel[] = [
  { id: 'anthropic/claude-sonnet-4-20250514',       name: 'Claude Sonnet 4',            description: 'Recommended — best coding + reasoning balance', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000003',    completion: '0.000015'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'anthropic/claude-3.7-sonnet',               name: 'Claude 3.7 Sonnet',          description: 'Previous Claude flagship', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000003',    completion: '0.000015'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'anthropic/claude-3.7-sonnet:thinking',      name: 'Claude 3.7 Sonnet (Thinking)', description: 'Extended thinking mode', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000003',    completion: '0.000015'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'anthropic/claude-3.5-sonnet',               name: 'Claude 3.5 Sonnet',          description: '', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000003',    completion: '0.000015'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'anthropic/claude-3-haiku',                  name: 'Claude 3 Haiku',             description: 'Fast & cheap', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000025',  completion: '0.00000125' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/gpt-4.1',                            name: 'GPT-4.1',                   description: 'Newest OpenAI flagship', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000002',    completion: '0.000008'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/gpt-4.1-mini',                       name: 'GPT-4.1 Mini',              description: 'Fast & cheap', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000004',   completion: '0.0000016'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/gpt-4o',                             name: 'GPT-4o',                    description: '', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000025',   completion: '0.00001'    }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/o3-mini',                            name: 'o3-mini',                   description: 'Reasoning', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000011',   completion: '0.0000044'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'google/gemini-2.5-pro-preview',             name: 'Gemini 2.5 Pro',            description: 'Newest Google flagship', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000125',  completion: '0.000010'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'google/gemini-2.0-flash-001',               name: 'Gemini 2.0 Flash',          description: 'Fast', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000001',   completion: '0.0000004'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'deepseek/deepseek-chat',                    name: 'DeepSeek V3',               description: 'Budget — strong coding', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000027',  completion: '0.0000011'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'deepseek/deepseek-chat-v3-0324',            name: 'DeepSeek V3 (Mar 2024)',    description: 'Free on OpenRouter', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0',           completion: '0'          }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'deepseek/deepseek-r1',                      name: 'DeepSeek R1',               description: 'Reasoning, open source — no tool calling', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000055',  completion: '0.00000219' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'deepseek/deepseek-r1-0528',                 name: 'DeepSeek R1-0528',          description: 'Reasoning + tool calling', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000055',  completion: '0.00000219' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'mistralai/mistral-large',                   name: 'Mistral Large',             description: '', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000002',    completion: '0.000006'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'meta-llama/llama-3.3-70b-instruct',        name: 'Llama 3.3 70B',            description: 'Open source', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000012',  completion: '0.0000003'  }, top_provider: { context_length: null, is_moderated: false } },
]

/** Format context length to human-readable (200K, 1M, etc.) */
function fmtCtx(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M ctx`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K ctx`
  return `${n} ctx`
}

/** Extract the provider family name from a model ID (e.g. "anthropic/…" → "Anthropic") */
function familyLabel(id: string): string {
  const prefix = id.split('/')[0] ?? id
  return prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/-/g, ' ')
}

interface SettingsPanelProps {
  onClose: () => void
}

type ValidationErrors = Partial<Record<'apiKey' | 'workspacePath', string>>

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    model, workspacePath, apiBase: storedApiBase,
    setApiKey, setModel, setWorkspacePath, setApiBase, setProvider,
    openRouterModels, setOpenRouterModels,
    ollamaModels, setOllamaModels,
    exaKey, setExaKey,
    maxIterations, setMaxIterations,
    enableVerification, setEnableVerification,
    addRecentWorkspacePath,
    routerConfig, setRouterConfig,
    updateGateway,
    settingsTab, setSettingsTab,
    gatewayHealth,
    rateLimitEnabled, setRateLimitEnabled,
    maxRequestsPerMinute, setMaxRequestsPerMinute,
  } = useAppStore(useShallow(s => ({
    model: s.model,
    workspacePath: s.workspacePath,
    apiBase: s.apiBase,
    setApiKey: s.setApiKey,
    setModel: s.setModel,
    setWorkspacePath: s.setWorkspacePath,
    setApiBase: s.setApiBase,
    setProvider: s.setProvider,
    openRouterModels: s.openRouterModels,
    setOpenRouterModels: s.setOpenRouterModels,
    ollamaModels: s.ollamaModels,
    setOllamaModels: s.setOllamaModels,
    exaKey: s.exaKey,
    setExaKey: s.setExaKey,
    maxIterations: s.maxIterations,
    setMaxIterations: s.setMaxIterations,
    enableVerification: s.enableVerification,
    setEnableVerification: s.setEnableVerification,
    addRecentWorkspacePath: s.addRecentWorkspacePath,
    routerConfig: s.routerConfig,
    setRouterConfig: s.setRouterConfig,
    updateGateway: s.updateGateway,
    settingsTab: s.settingsTab,
    setSettingsTab: s.setSettingsTab,
    gatewayHealth: s.gatewayHealth,
    rateLimitEnabled: s.rateLimitEnabled,
    setRateLimitEnabled: s.setRateLimitEnabled,
    maxRequestsPerMinute: s.maxRequestsPerMinute,
    setMaxRequestsPerMinute: s.setMaxRequestsPerMinute,
  })))

  const [localOpenRouterKey, setLocalOpenRouterKey] = useState('')
  const [localRequestyKey, setLocalRequestyKey] = useState('')
  const [localDeepSeekKey, setLocalDeepSeekKey] = useState('')
  const [localModel, setLocalModel] = useState(model)
  const [localWorkspace, setLocalWorkspace] = useState(workspacePath)
  const [localExaKey, setLocalExaKey] = useState(exaKey || '')
  const [localMaxIterations, setLocalMaxIterations] = useState(String(maxIterations ?? 50))
  // Preserve custom API base (e.g. proxy URL) — only reset to OR_BASE when switching back to openrouter
  const OR_BASE = 'https://openrouter.ai/api/v1'
  const OLLAMA_BASE = 'http://localhost:11434/v1'
  const [localApiBase, setLocalApiBase] = useState(
    storedApiBase && storedApiBase !== OLLAMA_BASE ? storedApiBase : OR_BASE
  )

  const [localEnableVerification, setLocalEnableVerification] = useState(enableVerification ?? true)

  // Rate limiting state
  const [localRateLimitEnabled, setLocalRateLimitEnabled] = useState(rateLimitEnabled ?? true)
  const [localMaxRPM, setLocalMaxRPM] = useState(String(maxRequestsPerMinute ?? 60))

    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [errors, setErrors] = useState<ValidationErrors>({})

    const [_ollamaRunning, setOllamaRunning] = useState<boolean | null>(null)
    const [_checkingOllama, setCheckingOllama] = useState(false)
    const [activeProvider, setActiveProvider] = useState(useAppStore.getState().provider || 'openrouter')

    useEffect(() => {
      async function init() {
        setCheckingOllama(true)
        const ok = await checkOllama()
        setOllamaRunning(ok)
        setCheckingOllama(false)
      }
      init()
    }, [])

    // Sync gateway keys into local state. Runs on mount AND whenever
    // gatewayConfigReady flips to true (i.e. after loadGatewayConfig finishes).
    // Without this, the panel opens with empty key fields because partialize
    // strips all gateway apiKeys from localStorage — they're only restored
    // asynchronously by loadGatewayConfig reading from the Tauri secure store.
    const gatewayConfigReady = useAppStore((s) => s.gatewayConfigReady)

    useEffect(() => {
      const state = useAppStore.getState()

      const orKey = state.gateways.find((g) => g.id === 'openrouter')?.apiKey || state.apiKey
      if (orKey) setLocalOpenRouterKey(orKey)

      const reqKey = state.gateways.find((g) => g.id === 'requesty')?.apiKey || ''
      if (reqKey) setLocalRequestyKey(reqKey)

      const dsKey = state.gateways.find((g) => g.id === 'deepseek')?.apiKey || ''
      if (dsKey) setLocalDeepSeekKey(dsKey)

      const p = state.provider
      if (p === 'openrouter' || p === 'requesty' || p === 'ollama' || p === 'deepseek') {
        setActiveProvider(p)
      }
    }, [gatewayConfigReady])

    // Local router config state

  const [localRouterMode, setLocalRouterMode] = useState(routerConfig.mode)
  const [localRouterBudget, setLocalRouterBudget] = useState(routerConfig.budget)
  const [localModelOverrides, setLocalModelOverrides] = useState<Record<string, boolean>>(routerConfig.modelOverrides)

  // Paid mode confirmation state
  const [pendingPaidMode, setPendingPaidMode] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  // Wrapped budget change handler with confirmation for paid mode
  const handleBudgetChange = (newBudget: string) => {
    if (newBudget === 'paid' && localRouterBudget !== 'paid') {
      setPendingPaidMode(true)
    } else {
      setLocalRouterBudget(newBudget)
    }
  }

  const confirmPaidMode = () => {
    setLocalRouterBudget('paid')
    setPendingPaidMode(false)
  }

  const cancelPaidMode = () => {
    setPendingPaidMode(false)
  }

  const scrollableRef = useRef<HTMLDivElement>(null)
  const [modelOpen, setModelOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const modelRef = useRef<HTMLDivElement>(null)
  const modelSearchRef = useRef<HTMLInputElement>(null)

  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null)
  const [fetchedCount, setFetchedCount] = useState<number | null>(
    openRouterModels.length > 0 ? openRouterModels.length : null
  )

    // The active model list: for Ollama show local models; for DeepSeek show native models; for cloud show fetched/fallback OR list
    const DEEPSEEK_MODELS: OpenRouterModel[] = [
      { id: 'deepseek-chat',     name: 'DeepSeek V3',     description: 'Latest V3 — strong coding, tool calling', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000027', completion: '0.0000011' }, top_provider: { context_length: null, is_moderated: false } },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1',     description: 'Reasoning model (R1 / R1-0528)', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000055', completion: '0.00000219' }, top_provider: { context_length: null, is_moderated: false } },
    ]
    const modelList: OpenRouterModel[] = activeProvider === 'ollama'
      ? ollamaModels.map((m) => ({
          id: m.name,
          name: m.name,
          description: m.size ? `${(m.size / 1e9).toFixed(1)} GB` : 'Local model',
          context_length: 128000,
          architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] },
          pricing: { prompt: '0', completion: '0' },
          top_provider: { context_length: null, is_moderated: false },
        }))
      : activeProvider === 'deepseek'
        ? DEEPSEEK_MODELS
        : openRouterModels.length > 0 ? openRouterModels : FALLBACK_MODELS

  // Filter + group models by family
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase()
    if (!q) return modelList
    return modelList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q),
    )
  }, [modelList, modelSearch])

  const groupedModels = useMemo(() => {
    const groups = new Map<string, OpenRouterModel[]>()
    for (const m of filteredModels) {
      const family = familyLabel(m.id)
      if (!groups.has(family)) groups.set(family, [])
      groups.get(family)!.push(m)
    }
    return groups
  }, [filteredModels])

  const selectedModelObj = modelList.find((m) => m.id === localModel)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false)
        setModelSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (modelOpen) {
      setTimeout(() => modelSearchRef.current?.focus(), 50)
    }
  }, [modelOpen])

  // Scroll to top when tab changes
  useEffect(() => {
    scrollableRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [settingsTab])

    async function handleFetchModels() {
      if (activeProvider === 'ollama') {
        setFetchingModels(true)
        setFetchModelsError(null)
        try {
          const resp = await fetch('http://localhost:11434/api/tags')
          if (!resp.ok) throw new Error(`Ollama returned HTTP ${resp.status}`)
          const data = await resp.json()
          const models = data.models || []
          setOllamaModels(models)
          setFetchedCount(models.length)
          if (models.length > 0 && !localModel) setLocalModel(models[0].name)
        } catch (e) {
          setFetchModelsError(e instanceof Error ? e.message : String(e))
        } finally {
          setFetchingModels(false)
        }
        return
      }
      if (activeProvider === 'openrouter' && !localOpenRouterKey.trim()) {
        setFetchModelsError('Enter your OpenRouter API key first')
        return
      }
      if (activeProvider === 'requesty' && !localRequestyKey.trim()) {
        setFetchModelsError('Enter your Requesty API key first')
        return
      }
      setFetchingModels(true)
      setFetchModelsError(null)
      try {
        // Requesty uses the same API format as OpenRouter, so we use the same fetch function
        const key = activeProvider === 'requesty'
          ? localRequestyKey.trim()
          : localOpenRouterKey.trim()
        const models = await fetchOpenRouterModels(key)
        setOpenRouterModels(models)
        setFetchedCount(models.length)
        setFetchModelsError(null)
        // If current model not in new list, keep it anyway — user may have typed custom ID
      } catch (e) {
        setFetchModelsError(e instanceof Error ? e.message : String(e))
      } finally {
        setFetchingModels(false)
      }
    }

  function validate(): ValidationErrors {
    const errs: ValidationErrors = {}
    if (activeProvider === 'openrouter') {
      if (!localOpenRouterKey.trim()) {
        errs.apiKey = 'API key is required'
      } else if (!localOpenRouterKey.trim().startsWith('sk-or-')) {
        errs.apiKey = 'OpenRouter keys start with sk-or-… — get one at openrouter.ai/keys'
      }
    }
    if (activeProvider === 'requesty') {
      if (!localRequestyKey.trim()) {
        errs.apiKey = 'API key is required'
      } else if (!localRequestyKey.trim().startsWith('req_')) {
        errs.apiKey = 'Requesty keys start with req_… — get one at app.requesty.ai'
      }
    }
    if (activeProvider === 'deepseek') {
      if (!localDeepSeekKey.trim()) {
        errs.apiKey = 'API key is required'
      } else if (!localDeepSeekKey.trim().startsWith('sk-')) {
        errs.apiKey = 'DeepSeek keys start with sk-… — get one at platform.deepseek.com/api-keys'
      }
    }
    if (localWorkspace.trim() && !localWorkspace.trim().startsWith('/')) {
      errs.workspacePath = 'Must be an absolute path (starting with /)'
    }
    return errs
  }

  function handleReset() {
    setConfirmReset(true)
  }

  function doReset() {
    setConfirmReset(false)
    setLocalOpenRouterKey('')
    setLocalRequestyKey('')
    setLocalDeepSeekKey('')
    setLocalModel('anthropic/claude-3.7-sonnet')
    setLocalWorkspace('')
    setLocalExaKey('')
    setLocalMaxIterations('50')
    setLocalEnableVerification(true)
    setLocalRateLimitEnabled(true)
    setLocalMaxRPM('60')
    setLocalRouterMode('auto')
    setLocalRouterBudget('free')
    setLocalModelOverrides({})
    setLocalApiBase(OR_BASE)
    setErrors({})
  }

    async function checkAndSave() {
      const errs = validate()
      if ((activeProvider === 'openrouter' || activeProvider === 'requesty' || activeProvider === 'deepseek') && Object.keys(errs).length > 0) { setErrors(errs); return }
      setErrors({})
      setSaving(true)
      setSaveError(null)

      const isOllama = activeProvider === 'ollama'
      const isOpenRouter = activeProvider === 'openrouter'
      const isRequesty = activeProvider === 'requesty'
      const isDeepSeek = activeProvider === 'deepseek'

      // Determine API base and provider
      const REQUESTY_BASE = 'https://router.requesty.ai/v1'
      const DEEPSEEK_BASE = 'https://api.deepseek.com/v1'
      const finalApiBase = isOllama ? OLLAMA_BASE : isRequesty ? REQUESTY_BASE : isDeepSeek ? DEEPSEEK_BASE : localApiBase
      const finalProvider = isOllama ? 'ollama' : isRequesty ? 'requesty' : isDeepSeek ? 'deepseek' : 'openrouter'

        // Save keys to their respective gateways.
        // Each gateway's enabled state must reflect the active provider so that
        // resolveConnection() (which picks the lowest-priority enabled gateway)
        // always returns the gateway the user actually configured — not a higher-
        // priority gateway (e.g. OpenRouter at priority 0) with an empty key.
        updateGateway('openrouter', { apiKey: localOpenRouterKey.trim(), enabled: isOpenRouter })
        updateGateway('requesty',   { apiKey: localRequestyKey.trim(),   enabled: isRequesty })
        updateGateway('deepseek',   { apiKey: localDeepSeekKey.trim(),   enabled: isDeepSeek })
        // Ollama has its own enabled flag — enable/disable based on active provider.
        updateGateway('ollama',     { enabled: isOllama })

        // Persist all gateway configs (including API keys) to the Tauri secure store.
        // This is the primary persistence path — get_gateways reads them back on reload.
        try {
          const updatedGateways = useAppStore.getState().gateways
          await tauriInvoke('save_gateways', { gateways: updatedGateways })
        } catch (e) {
          log.warn('Failed to save gateways', e instanceof Error ? e : new Error(String(e)))
          // Non-fatal — save_config below still persists the active key
        }

        // Persist keys to sessionStorage so that loadGatewayConfig's browser-mode
        // fallback path (Tauri not available) can recover them across HMR reloads.
        // Gateway keys are intentionally excluded from Zustand's localStorage persist
        // (partialize strips them), so sessionStorage is the in-memory bridge.
        try {
          if (localOpenRouterKey.trim()) sessionStorage.setItem('nasus:key:openrouter', localOpenRouterKey.trim())
          if (localRequestyKey.trim())   sessionStorage.setItem('nasus:key:requesty',   localRequestyKey.trim())
          if (localDeepSeekKey.trim())   sessionStorage.setItem('nasus:key:deepseek',   localDeepSeekKey.trim())
          sessionStorage.setItem('nasus:active-provider', finalProvider)
        } catch { /* sessionStorage not available in this context */ }

      // The legacy/active apiKey in the store is the one for the currently active provider
      const finalApiKey = isOpenRouter ? localOpenRouterKey.trim()
        : isRequesty ? localRequestyKey.trim()
        : isDeepSeek ? localDeepSeekKey.trim()
        : ''

        setApiKey(finalApiKey)
        setModel(localModel)
        setWorkspacePath(localWorkspace.trim())
      if (localWorkspace.trim()) addRecentWorkspacePath(localWorkspace.trim())
      setApiBase(finalApiBase)
      setProvider(finalProvider)
        const trimmedExaKey = localExaKey.trim()
        setExaKey(trimmedExaKey)

        // Persist Exa key to OS keyring (not localStorage)
        try {
          await tauriInvoke('set_exa_key', { key: trimmedExaKey })
        } catch (e) {
          log.warn('Failed to save Exa key to keyring', e instanceof Error ? e : new Error(String(e)))
          // Non-fatal, continue
        }

        const searchConfig = {
          exaKey: trimmedExaKey,
        }

        try {
          await tauriInvoke('save_search_config', { searchConfig })
        } catch (e) {
          log.warn('Failed to save search config', e instanceof Error ? e : new Error(String(e)))
          // Non-fatal, continue
        }

        const parsedIter = Math.max(1, Math.min(200, parseInt(localMaxIterations, 10) || 50))
        setMaxIterations(parsedIter)
        setEnableVerification(localEnableVerification)

        // Save rate limiting settings
        const parsedRPM = Math.max(1, Math.min(600, parseInt(localMaxRPM, 10) || 60))
        setRateLimitEnabled(localRateLimitEnabled)
        setMaxRequestsPerMinute(parsedRPM)

      // Save router config (force manual for Ollama)
      setRouterConfig({
        mode: isOllama ? 'manual' : localRouterMode,
        budget: localRouterBudget,
        modelOverrides: localModelOverrides,
      })
      try {
        await tauriInvoke('save_router_settings', {
          mode: isOllama ? 'manual' : localRouterMode,
          budget: localRouterBudget,
          modelOverrides: localModelOverrides,
        })
      } catch (e) {
        log.warn('Failed to save router settings', e instanceof Error ? e : new Error(String(e)))
        // Non-fatal, continue
      }

      // Main config save - this one is critical
      try {
        await tauriInvoke('save_config', {
          apiKey: finalApiKey,
          model: localModel,
          workspacePath: localWorkspace.trim(),
          apiBase: finalApiBase,
          provider: finalProvider,
        })
      } catch (e) {
        setSaving(false)
        setSaveError('Failed to save settings. Please try again.')
        return
      }

      setSaving(false)
      setSaved(true)
      setTimeout(() => { setSaved(false); onClose() }, 900)
    }


  const busy = saving
  const isPaid = isPaidRoute(activeProvider, { mode: localRouterMode, budget: localRouterBudget }, localModel)
  const label = getRouteLabel(activeProvider, { mode: localRouterMode, budget: localRouterBudget }, localModel)

  return (
      <div
        className="fixed inset-0 z-50 flex-center settings-backdrop"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <FocusTrap
          focusTrapOptions={{
            onDeactivate: onClose,
            clickOutsideDeactivates: true,
            escapeDeactivates: true,
          }}
        >
          <div
            className="fade-in flex-col settings-card"
          >
          {/* Header */}
          <div className="flex-v-center justify-between shrink-0 settings-header">
            <div className="flex-v-center gap-2">
              <Pxi name="cog" size={14} className="text-amber" />
              <h2 style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '0.12em', color: 'var(--tx-primary)', margin: 0, textTransform: 'uppercase' }}>System Configuration</h2>
            </div>
            {/* OpenRouter badge */}
            <div className="flex-v-center gap-2">
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 6,
                  background: isPaid ? 'rgba(234,179,8,0.12)' : 'rgba(34,197,94,0.12)',
                  color: isPaid ? 'var(--amber-soft)' : '#4ade80',
                  fontWeight: 600, letterSpacing: '0.04em', border: `1px solid ${isPaid ? 'rgba(234,179,8,0.2)' : 'rgba(34,197,94,0.2)'}`
                }}>
                  {label}
                </span>


            <button
              onClick={onClose}
              aria-label="Close settings"
              className="text-tertiary settings-close-btn hover-text-primary"
            >
              <Pxi name="times" size={14} />
            </button>
          </div>
        </div>

          {/* Tab Bar */}
          <div className="flex-v-center gap-1 shrink-0 settings-tabs">
          {(['general', 'model', 'execution', 'search', 'about'] as const).map((tab) => {
            const isActive = settingsTab === tab
            return (
              <button
                key={tab}
                onClick={() => setSettingsTab(tab)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: isActive ? 'var(--amber)' : 'transparent',
                  color: isActive ? '#000' : 'var(--tx-secondary)',
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'background 0.12s, color 0.12s',
                  border: 'none',
                }}
                >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          })}
        </div>

          {/* Scrollable content */}
          <div ref={scrollableRef} className="flex-col settings-scroll">
          <div className="flex-col gap-5 pb-1">
            {settingsTab === 'general' && (
            <>
            {/* ── Workspace Path ── */}
            <Field
              label="Workspace Path"
              icon="folder-open"
              hint={<>Host directory mounted into the sandbox at <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-secondary)' }}>/workspace</code></>}
              error={errors.workspacePath}
            >
              <WorkspacePicker
                value={localWorkspace}
                onChange={(v) => { setLocalWorkspace(v); setErrors((p) => ({ ...p, workspacePath: undefined })) }}
                error={errors.workspacePath}
              />
            </Field>

              {/* ── Verification Toggle ── */}
              <div className="flex-v-center justify-between settings-banner">
                <div className="flex-col gap-0.5">
                  <span className="text-[12px] font-medium text-[var(--tx-primary)]">
                    Enable verification
                  </span>
                  <span className="text-tertiary text-[10px]">
                    Automatically verify execution results and self-correct if needed
                  </span>
                </div>
              <button
                type="button"
                onClick={() => setLocalEnableVerification(!localEnableVerification)}
                className="settings-toggle"
                style={{ background: localEnableVerification ? 'var(--amber)' : 'rgba(255,255,255,0.12)' }}
              >
                <span className="settings-toggle-knob" style={{ left: localEnableVerification ? 'calc(100% - 20px)' : 2 }} />
              </button>
            </div>

              {/* ── Max Iterations ── */}
              <Field label="Max Iterations" icon="repeat" hint="Max agent loop iterations per task (1–200). Higher values let the agent work longer on complex tasks.">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={localMaxIterations}
                  onChange={(e) => setLocalMaxIterations(e.target.value)}
                  className="settings-input placeholder-[var(--tx-muted)]"
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
              </Field>

              {/* ── Rate Limiting ── */}
              <div className="flex-col settings-rate-section">
                <label className="flex-v-center settings-label">
                  <Pxi name="gauge" size={12} className="text-tertiary" />
                  Rate Limiting
                </label>

                  {/* Enable toggle row */}
                  <div className="flex-v-center justify-between settings-banner">
                    <div className="flex-col gap-0.5">
                      <span className="text-[12px] font-medium text-[var(--tx-primary)]">
                        Enable rate limiting
                      </span>
                      <span className="text-tertiary text-[10px]">
                        Throttle outbound API requests to avoid provider rate-limit errors
                      </span>
                    </div>
                  <button
                    type="button"
                    onClick={() => setLocalRateLimitEnabled(!localRateLimitEnabled)}
                    className="settings-toggle"
                    style={{ background: localRateLimitEnabled ? 'var(--amber)' : 'rgba(255,255,255,0.12)' }}
                  >
                    <span className="settings-toggle-knob" style={{ left: localRateLimitEnabled ? 'calc(100% - 20px)' : 2 }} />
                  </button>
                </div>

                {/* RPM input — only shown when enabled */}
                  {localRateLimitEnabled && (
                    <Field label="Max requests / minute" icon="clock" hint="Maximum LLM API calls per minute (1–600). Default: 60.">
                      <div className="flex-v-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={600}
                          value={localMaxRPM}
                          onChange={(e) => setLocalMaxRPM(e.target.value)}
                          className="settings-input placeholder-[var(--tx-muted)] flex-1"
                          onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                        />
                          <span className="text-tertiary text-[11px] whitespace-nowrap">req / min</span>
                      </div>
                    </Field>
                  )}
              </div>
            </>
            )}

            {settingsTab === 'model' && (
            <>
              {/* ── Provider Selection (Radio Group) ── */}
              <div className="flex-col settings-provider-section">
                <label className="flex-v-center settings-label">
                  <Pxi name="cloud" size={12} className="text-tertiary" />
                  AI Provider
                </label>

                    {/* Radio options */}
                    <div className="flex-col gap-1.5">
                    {[
                      {
                        id: 'openrouter',
                        label: 'OpenRouter',
                        description: 'Cloud models via OpenRouter — widest selection',
                        healthKey: 'openrouter' as const,
                      },
                      {
                        id: 'requesty',
                        label: 'Requesty',
                        description: 'LLM router with automatic failover & caching',
                        healthKey: 'requesty' as const,
                      },
                      {
                        id: 'deepseek',
                        label: 'DeepSeek (Direct)',
                        description: 'DeepSeek V3 & R1 — direct API, lowest cost',
                        healthKey: 'deepseek' as const,
                      },
                      {
                        id: 'ollama',
                        label: 'Ollama (Local)',
                        description: 'Run models locally on your machine',
                        healthKey: 'ollama' as const,
                      },
                    ].map((opt) => {
                      const isSelected = activeProvider === opt.id
                      const health = gatewayHealth.find(h => h.gatewayId === opt.healthKey)
                      const hasKey = opt.id === 'openrouter'
                        ? Boolean(localOpenRouterKey.trim())
                        : opt.id === 'requesty'
                          ? Boolean(localRequestyKey.trim())
                          : opt.id === 'deepseek'
                            ? Boolean(localDeepSeekKey.trim())
                            : true // Ollama doesn't need a key

                    const statusColor = health?.status === 'healthy' ? '#22c55e'
                      : health?.status === 'degraded' ? '#eab308'
                      : health?.status === 'down' ? '#ef4444'
                      : 'var(--tx-muted)'

                    return (
                      <button
                        key={opt.id}
                        type="button"
                          onClick={() => {
                            setActiveProvider(opt.id)
                            // Auto-fetch models when switching providers (if key exists)
                            if (opt.id === 'openrouter' && localOpenRouterKey.trim()) {
                              handleFetchModels()
                            } else if (opt.id === 'requesty' && localRequestyKey.trim()) {
                              // Requesty uses the same API as OpenRouter, so we can fetch models the same way
                              handleFetchModels()
                            } else if (opt.id === 'deepseek') {
                              // DeepSeek direct — pre-select deepseek-chat as default model
                              setLocalModel('deepseek-chat')
                            } else if (opt.id === 'ollama') {
                              // Fetch Ollama models
                              fetch('http://localhost:11434/api/tags')
                                .then(r => r.json())
                                .then(data => {
                                  useAppStore.getState().setOllamaModels(data.models || [])
                                })
                                .catch(() => {})
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: `1px solid ${isSelected ? 'oklch(64% 0.214 40.1 / 0.5)' : 'rgba(255,255,255,0.08)'}`,
                            background: isSelected ? 'oklch(64% 0.214 40.1 / 0.08)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'all 0.12s',
                            gap: 10,
                          }}
                            className="flex-v-center settings-model-row"
                        >
                        {/* Radio indicator */}
                        <div className="flex-center shrink-0" style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${isSelected ? 'var(--amber)' : 'rgba(255,255,255,0.2)'}`,
                        }}>
                          {isSelected && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)' }} />
                          )}
                        </div>

                        {/* Health dot */}
                        <div className="shrink-0" style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: statusColor,
                          boxShadow: health?.status === 'healthy' ? `0 0 6px ${statusColor}60` : 'none',
                        }} />

                          {/* Provider info */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex-v-center gap-1.5">
                              <span style={{
                                fontSize: 13, fontWeight: 500,
                                color: isSelected ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                              }}>
                                {opt.label}
                              </span>
                              {hasKey ? (
                                <Pxi name="check-circle" size={12} style={{ color: '#22c55e' }} />
                              ) : (
                                <span className="text-muted text-[9px]">Key required</span>
                              )}
                            </div>
                            <span className="text-tertiary text-[11px] overflow-hidden text-ellipsis whitespace-nowrap">
                              {opt.description}
                            </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* API key input for selected provider */}
                {activeProvider === 'openrouter' && (
                  <Field
                    label="OpenRouter API Key"
                    icon="key"
                    hint={<>Your OpenRouter key. Get one at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="settings-link">openrouter.ai/keys</a></>}
                    error={errors.apiKey}
                  >
                    <input
                      type="password"
                      value={localOpenRouterKey}
                      onChange={(e) => {
                        setLocalOpenRouterKey(e.target.value)
                        setErrors((p) => ({ ...p, apiKey: undefined }))
                      }}
                      placeholder="sk-or-v1-..."
                      className="settings-input placeholder-[var(--tx-muted)]"
                      style={{ border: `1px solid ${errors.apiKey ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                    />
                  </Field>
                )}

                  {activeProvider === 'requesty' && (
                    <Field
                      label="Requesty API Key"
                      icon="key"
                      hint={<>Your Requesty key. Get one at <a href="https://app.requesty.ai/getting-started" target="_blank" rel="noreferrer" className="settings-link">app.requesty.ai</a></>}
                      error={errors.apiKey}
                    >
                      <input
                        type="password"
                        value={localRequestyKey}
                        onChange={(e) => {
                          setLocalRequestyKey(e.target.value)
                          setErrors((p) => ({ ...p, apiKey: undefined }))
                        }}
                        placeholder="req_..."
                        className="settings-input placeholder-[var(--tx-muted)]"
                        style={{ border: `1px solid ${errors.apiKey ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      />
                    </Field>
                  )}

                  {activeProvider === 'deepseek' && (
                    <Field
                      label="DeepSeek API Key"
                      icon="key"
                      hint={<>Your DeepSeek key. Get one at <a href="https://platform.deepseek.com/api-keys" target="_blank" rel="noreferrer" className="settings-link">platform.deepseek.com/api-keys</a></>}
                      error={errors.apiKey}
                    >
                      <input
                        type="password"
                        value={localDeepSeekKey}
                        onChange={(e) => {
                          setLocalDeepSeekKey(e.target.value)
                          setErrors((p) => ({ ...p, apiKey: undefined }))
                        }}
                        placeholder="sk-..."
                        className="settings-input placeholder-[var(--tx-muted)]"
                        style={{ border: `1px solid ${errors.apiKey ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}` }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                      />
                    </Field>
                  )}

                  {activeProvider === 'ollama' && (
                    <OllamaStatusBanner />
                  )}
              </div>

                  {/* ── Model ── */}
                <Field label="Override Model" icon="sparkles" hint="Manually select a model. Only used when Model Router is in 'Manual' mode.">
                  <div className="flex-col gap-2">
                  {/* Fetch row */}
                  <div className="flex-v-center gap-2">
                        <button
                          type="button"
                            onClick={handleFetchModels}
                            disabled={fetchingModels}
                            style={{
                              gap: 6,
                              padding: '4px 10px', borderRadius: 8, fontSize: 11,
                              background: 'rgba(255,255,255,0.07)', border: 'none',
                              cursor: fetchingModels ? 'default' : 'pointer',
                              color: 'var(--tx-secondary)', transition: 'color 0.12s',
                              opacity: fetchingModels ? 0.45 : 1,
                            }}
                            title={activeProvider === 'ollama' ? 'Refresh models from local Ollama' : 'Fetch all available models from OpenRouter'}
                            className="flex-v-center hover-text-primary"
                          >
                          <Pxi name={fetchingModels ? 'spinner-third' : 'arrow-rotate-right'} size={12} />
                          {fetchingModels ? 'Fetching…' : activeProvider === 'ollama' ? 'Refresh Ollama models' : 'Fetch all models'}
                        </button>
                        {fetchModelsError && (
                          <span className="fetch-error">{fetchModelsError}</span>
                        )}
                        {fetchedCount !== null && !fetchModelsError && (
                          <span className="text-tertiary fetch-count">{fetchedCount} models</span>
                        )}
                  </div>

                  {/* Model dropdown */}
                    <div className="relative" ref={modelRef}>
                      <button
                        type="button"
                        onClick={() => setModelOpen((o) => !o)}
                        className="flex-v-center justify-between w-full"
                        style={{
                          padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none', cursor: 'pointer',
                          background: '#0d0d0d',
                          border: `1px solid ${modelOpen ? 'oklch(64% 0.214 40.1 / 0.5)' : 'rgba(255,255,255,0.08)'}`,
                          color: 'var(--tx-primary)', transition: 'border-color 0.12s',
                          gap: 8,
                        }}
                      >
                          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">
                            {selectedModelObj?.name ?? localModel}
                          </span>
                          {selectedModelObj && (
                            <span className="text-tertiary shrink-0 text-[10px] whitespace-nowrap">
                              {fmtCtx(selectedModelObj.context_length)} · {formatTokenPrice(selectedModelObj.pricing?.completion)}/tok out
                            </span>
                          )}
                          <Pxi name={modelOpen ? 'chevron-up' : 'chevron-down'} size={12} className="text-tertiary shrink-0" />
                        </button>

                      {modelOpen && (
                        <div className="flex-col settings-dropdown">
                            {/* Search */}
                            <div className="model-search-row">
                              <div className="flex-v-center model-search-inner">
                                <Pxi name="search" size={12} className="text-tertiary shrink-0" />
                              <input
                                ref={modelSearchRef}
                                type="text"
                                value={modelSearch}
                                onChange={(e) => setModelSearch(e.target.value)}
                                placeholder="Search models…"
                                className="model-search-input placeholder-[var(--tx-muted)]"
                              />
                              {modelSearch && (
                                <button type="button" onClick={() => setModelSearch('')} aria-label="Clear model search" className="text-tertiary model-search-clear">
                                  <Pxi name="times" size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                            {/* Grouped list */}
                            <div className="model-list-scroll">
                              {groupedModels.size === 0 ? (
                                <div className="text-tertiary text-[12px] text-center p-3">
                                  No models match "{modelSearch}"
                                </div>
                          ) : [...groupedModels.entries()].map(([family, models]) => (
                            <div key={family}>
                              {/* Group header */}
                              <div className="model-group-header">
                                {family}
                              </div>
                                {models.map((m) => {
                                  const isSelected = m.id === localModel
                                  return (
                                    <button
                                      key={m.id}
                                        type="button"
                                        onClick={() => { setLocalModel(m.id); setModelOpen(false); setModelSearch('') }}
                                        className="flex-col w-full hover-bg-app-3"
                                        style={{
                                          alignItems: 'flex-start',
                                          padding: '7px 12px', textAlign: 'left', border: 'none', cursor: 'pointer', gap: 2,
                                          color: isSelected ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                                          background: isSelected ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                                          transition: 'background 0.1s',
                                        }}
                                    >
                                          <div className="flex-v-center justify-between w-full gap-2">
                                            <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]">{m.name}</span>
                                            <div className="flex-v-center shrink-0 gap-1.5">
                                            <span className="text-tertiary text-[10px] whitespace-nowrap">
                                              {fmtCtx(m.context_length)}
                                            </span>
                                            <span className="text-tertiary text-[10px] whitespace-nowrap">
                                              {formatTokenPrice(m.pricing?.completion)}/tok
                                            </span>
                                            {isSelected && <Pxi name="check" size={12} className="text-amber" />}
                                          </div>
                                        </div>
                                        {m.description && (
                                          <span className="text-tertiary router-model-desc">{m.description}</span>
                                        )}
                                    </button>
                                  )
                                })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Field>

              {/* ── Model Router ── */}
              <ModelRouterSection
                mode={localRouterMode}
                onModeChange={setLocalRouterMode}
                budget={localRouterBudget}
                onBudgetChange={handleBudgetChange}
                modelOverrides={localModelOverrides}
                onModelOverridesChange={setLocalModelOverrides}
              />
            </>
            )}

            {/* ── Execution Tab ── */}
              {settingsTab === 'execution' && (
              <>
                <div className="flex-col settings-section">
                  <div className="flex-v-center gap-2">
                    <Pxi name="terminal" size={20} className="text-amber" />
                    <span className="settings-section-title">
                      Code Execution Mode
                    </span>
                  </div>
                  <div className="text-tertiary settings-exec-desc">
                    Nasus runs code in isolated Docker containers for security. Ensure Docker is running before executing tasks.
                  </div>
                  <div className="flex-v-center gap-2 docker-status-row">
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)40',
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--tx-secondary)' }}>
                    Docker — Enabled
                  </span>
                </div>
              </div>
            </>
            )}

            {/* ── Search Tab ── */}
            {settingsTab === 'search' && (
            <>
              <SearchSection
                exaKey={localExaKey}
                onExaKeyChange={setLocalExaKey}
              />
            </>
            )}

            {/* ── About Tab ── */}
              {settingsTab === 'about' && (
              <>
                <div className="flex-col settings-section gap-4">
                  <div className="about-header">
                    <div className="flex-center gap-2 mb-2">
                      <Pxi name="cpu" size={24} className="text-amber" />
                      <span className="about-title">Nasus</span>
                    </div>
                    <span className="text-tertiary text-[11px]">Autonomous AI Agent · Desktop Application</span>
                  </div>

                  <div className="about-desc">
                    Nasus is a multi-agent system that plans, executes, and verifies complex tasks using tool-based execution.
                  </div>

                  <div className="about-heading">
                    Keyboard Shortcuts
                  </div>
                  <div className="flex-col gap-1.5 text-[11px]">
                    {[
                      { key: '⌘ + ,', desc: 'Open Settings' },
                      { key: '⌘ + Enter', desc: 'Submit task' },
                      { key: '⌘ + K', desc: 'New conversation' },
                      { key: 'Escape', desc: 'Close modal' },
                    ].map(s => (
                      <div key={s.key} className="flex-v-center justify-between about-shortcut-row">
                        <span className="kbd-shortcut">{s.key}</span>
                        <span>{s.desc}</span>
                      </div>
                    ))}
                  </div>
              </div>
            </>
            )}
          </div>
        </div>{/* end scrollable */}

          {/* Actions */}
          <div className="flex-v-center justify-between shrink-0 settings-footer">
            <button
              onClick={handleReset}
              className="settings-reset-btn"
              title="Reset all settings to defaults"
            >
            Reset
          </button>
          <div className="flex-v-center gap-2">
            <button
                onClick={onClose}
                className="settings-cancel-btn"
              >
              Cancel
            </button>
              <button
                onClick={checkAndSave}
                disabled={busy}
                className="flex-v-center settings-save-btn"
                style={{
                  gap: 8,
                  padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                  background: saveError ? 'rgba(239,68,68,0.8)' : 'var(--amber)', color: '#000',
                  opacity: busy ? 0.45 : 1, transition: 'background 0.12s',
                }}
              >
              {saveError ? (
                <><Pxi name="exclamation-triangle" size={14} style={{ color: '#000' }} /> Failed to save</>
              ) : saved ? (
                <><Pxi name="check" size={14} style={{ color: '#000' }} /> Saved</>
              ) : saving ? (
                <><Pxi name="spinner-third" size={14} style={{ color: '#000' }} /> Saving…</>
              ) : (
                'Save settings'
              )}
            </button>
          </div>
        </div>

          {/* Paid mode confirmation dialog */}
            {pendingPaidMode && (
              <div className="fixed inset-0 z-[60] flex-center settings-backdrop">
                <div className="flex-col settings-confirm-card">
                  <div className="flex-v-center gap-2">
                    <div className="flex-center shrink-0 w-8 h-8 rounded-lg bg-[rgba(234,179,8,0.15)]">
                      <Pxi name="triangle-exclamation" size={20} className="text-amber" />
                    </div>
                    <h3 className="confirm-title m-0">
                      Confirm Paid Mode
                    </h3>
                  </div>

                  <p className="confirm-body m-0">
                    Paid mode will use your OpenRouter API credits for each request. Make sure you have credits available at <a href="https://openrouter.ai/credits" target="_blank" rel="noreferrer" className="settings-link">openrouter.ai/credits</a>.
                  </p>

                  <div className="flex-v-center justify-end gap-2.5">
                    <button
                      onClick={cancelPaidMode}
                      className="confirm-cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmPaidMode}
                      className="settings-save-btn"
                    >
                      Continue to Paid
                    </button>
                  </div>
              </div>
            </div>
              )}

            {confirmReset && (
              <ConfirmModal
                title="Reset all settings?"
                message="This will clear your API keys and restore all preferences to defaults."
                confirmLabel="Reset"
                onConfirm={doReset}
                onCancel={() => setConfirmReset(false)}
                danger
              />
            )}
          </div>
          </FocusTrap>
        </div>
      )
  }
  
  // ─── OllamaStatusBanner ───────────────────────────────────────────────────────

function OllamaStatusBanner() {
  const [status, setStatus] = useState<'checking' | 'running' | 'stopped'>('checking')

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const resp = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) })
        if (!cancelled) setStatus(resp.ok ? 'running' : 'stopped')
      } catch {
        if (!cancelled) setStatus('stopped')
      }
    }
    check()
    return () => { cancelled = true }
  }, [])

  if (status === 'checking') {
    return (
      <div className="flex-v-center gap-2 ollama-banner ollama-banner--checking">
        <Pxi name="spinner-third" size={14} className="text-tertiary" />
        <span className="text-tertiary text-[11px]">Checking Ollama status…</span>
      </div>
    )
  }

  if (status === 'running') {
    return (
      <div className="flex-v-center gap-2 ollama-banner ollama-banner--running">
          <div className="ollama-dot" />
          <span className="about-desc leading-none">Ollama is running on localhost:11434. No API key needed.</span>
        </div>
    )
  }

  return (
    <div className="flex-v-center gap-2 ollama-banner ollama-banner--stopped">
      <Pxi name="exclamation-triangle" size={14} className="text-error" />
      <div className="flex-col gap-0.5">
        <span className="text-error text-[11px] font-medium">Ollama is not running</span>
        <span className="text-tertiary text-[10px]">Start Ollama with <code className="inline-code">ollama serve</code> and pull a model with <code className="inline-code">ollama pull llama3.2</code></span>
      </div>
    </div>
  )
}

function SearchSection({
  exaKey, onExaKeyChange,
}: {
  exaKey: string
  onExaKeyChange: (v: string) => void
}) {
  return (
    <div className="flex-col gap-3">
      <Field label="Exa API Key" icon="key"
        hint={<>1,000 free searches/month, no credit card required. Get your key at <a href="https://dashboard.exa.ai" target="_blank" rel="noreferrer" className="settings-link">dashboard.exa.ai</a></>}
      >
        <input type="password" value={exaKey} onChange={(e) => onExaKeyChange(e.target.value)}
          placeholder="exa_…" className="settings-input placeholder-[var(--tx-muted)]"
          onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        />
      </Field>
    </div>
    )
}

// ─── ModelRouterSection ───────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  premium:  { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', label: 'Premium'  },
  standard: { bg: 'rgba(234,179,8,0.1)',   color: 'var(--amber)', label: 'Standard' },
  budget:   { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80',      label: 'Budget'   },
  free:     { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8',      label: 'Free'     },
}

function ModelRouterSection({
  mode, onModeChange,
  budget, onBudgetChange,
  modelOverrides, onModelOverridesChange,
}: {
  mode: string
  onModeChange: (v: string) => void
  budget: string
  onBudgetChange: (v: string) => void
  modelOverrides: Record<string, boolean>
  onModelOverridesChange: (v: Record<string, boolean>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { routerConfig, openRouterModels } = useAppStore(useShallow(s => ({
    routerConfig: s.routerConfig,
    openRouterModels: s.openRouterModels,
  })))

  // Use registry from Tauri backend if available; fall back to openRouterModels from the store,
  // then to the curated FALLBACK_MODELS list so the section is never empty in browser mode.
  const registry = routerConfig.registry || []

  type UIModel = { id: string; name: string; tier: 'premium' | 'standard' | 'budget' | 'free'; provider: string }

  const allModels: UIModel[] = registry.length > 0
    ? registry.map((m) => ({
        id: m.id,
        name: m.display_name,
        tier: m.cost_tier.toLowerCase() as UIModel['tier'],
        provider: m.provider as string,
      }))
    : (openRouterModels.length > 0 ? openRouterModels : FALLBACK_MODELS).map((m) => {
        const pricing = parseFloat(m.pricing?.completion ?? '0')
        const tier: UIModel['tier'] =
          m.id.endsWith(':free') ? 'free'
          : pricing === 0 ? 'free'
          : pricing < 0.0000005 ? 'budget'
          : pricing < 0.000005 ? 'standard'
          : 'premium'
        return {
          id: m.id,
          name: m.name,
          tier,
          provider: m.id.split('/')[0] ?? 'unknown',
        }
      })

  // Which models to show based on budget
  const visibleModels = budget === 'free'
    ? allModels.filter((m) => m.tier === 'free')
    : allModels.filter((m) => m.tier !== 'free')

  function isEnabled(modelId: string): boolean {
    if (modelId in modelOverrides) return modelOverrides[modelId]
    return true // default: all enabled
  }

  function toggleModel(modelId: string) {
    const current = isEnabled(modelId)
    onModelOverridesChange({ ...modelOverrides, [modelId]: !current })
  }

  const isAutoMode = mode === 'auto'

  // Refresh models state
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState('')

  async function handleRefreshModels() {
    setRefreshing(true)
    setRefreshMessage('')
    try {
      const models = await tauriInvoke<{ id: string; display_name: string }[]>('refresh_models')
      // Tauri command updates the backend registry; re-read it from store state
      // The registry update comes via a Tauri event listener — trigger a no-op
      // state touch so ModelRouterSection re-renders with the new registry.
      const state = useAppStore.getState()
      state.setRouterConfig({ ...state.routerConfig })
      setRefreshMessage(`Updated: ${models?.length ?? 0} models from OpenRouter`)
      setTimeout(() => setRefreshMessage(''), 3000)
    } catch (e) {
      setRefreshMessage(`Failed: ${e instanceof Error ? e.message : String(e)}`)
      setTimeout(() => setRefreshMessage(''), 5000)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex-col settings-router-section">
      {/* Header row with refresh button */}
      <div className="flex-v-center justify-between">
        <label className="flex-v-center settings-label" style={{ marginBottom: 2 }}>
          <Pxi name="route" size={10} className="text-tertiary" />
          Model Router
        </label>
        <button
          type="button"
          onClick={handleRefreshModels}
          disabled={refreshing}
          title="Fetch latest models from OpenRouter"
            className="flex-v-center hover-bg-app-3"
            style={{
              padding: '4px 8px', borderRadius: 6, fontSize: 10,
              background: refreshing ? 'rgba(255,255,255,0.05)' : 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: refreshing ? 'var(--tx-muted)' : 'var(--tx-tertiary)',
              cursor: refreshing ? 'wait' : 'pointer',
              gap: 4,
              transition: 'all 0.12s',
            }}
        >
          <Pxi name={refreshing ? 'spinner-third' : 'refresh-cw'} size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : undefined }} />
          {refreshing ? 'Fetching...' : 'Refresh'}
        </button>
      </div>
      {refreshMessage && (
        <div style={{
          fontSize: 10, padding: '6px 8px', borderRadius: 6,
          background: refreshMessage.startsWith('Failed') ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
          color: refreshMessage.startsWith('Failed') ? '#fca5a5' : '#86efac',
          border: `1px solid ${refreshMessage.startsWith('Failed') ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
        }}>
          {refreshMessage}
        </div>
      )}

        {/* Mode: Auto vs Manual */}
        <div className="flex-v-center gap-1.5">
        {[
          { id: 'auto', label: 'Auto', desc: 'Nasus picks the best model per task' },
          { id: 'manual', label: 'Manual', desc: 'Always use the model selected above' },
        ].map((opt) => {
          const isSel = isAutoMode ? opt.id === 'auto' : opt.id === 'manual'
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onModeChange(opt.id === 'auto' ? 'auto' : mode === 'auto' ? 'anthropic/claude-3.7-sonnet' : mode)}
              title={opt.desc}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 12,
                border: `1px solid ${isSel ? 'oklch(64% 0.214 40.1 / 0.4)' : 'rgba(255,255,255,0.08)'}`,
                background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                color: isSel ? 'var(--amber)' : 'var(--tx-secondary)',
                  cursor: 'pointer', transition: 'all 0.12s', fontWeight: isSel ? 600 : 400,
                }}
                className="hover-bg-app-3"
              >
                {opt.label}
              </button>
            )
          })}
        </div>

        {/* Budget: Free vs Paid (only in Auto mode) */}
      {isAutoMode && (
        <div>
          <div className="text-tertiary" style={{ fontSize: 10, marginBottom: 6, letterSpacing: '0.04em' }}>
            Budget
          </div>
            <div className="flex-v-center gap-1.5">
              {[
                { id: 'paid', label: 'Paid', desc: 'Best models — requires credits on OpenRouter' },
                { id: 'free', label: 'Free only', desc: 'Only models with $0 cost — no credits needed' },
              ].map((opt) => {
              const isSel = budget === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onBudgetChange(opt.id)}
                  title={opt.desc}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 12,
                    border: `1px solid ${isSel ? (opt.id === 'free' ? 'rgba(129,140,248,0.4)' : 'oklch(64% 0.214 40.1 / 0.4)') : 'rgba(255,255,255,0.08)'}`,
                    background: isSel ? (opt.id === 'free' ? 'rgba(99,102,241,0.1)' : 'oklch(64% 0.214 40.1 / 0.1)') : 'transparent',
                    color: isSel ? (opt.id === 'free' ? '#818cf8' : 'var(--amber)') : 'var(--tx-secondary)',
                      cursor: 'pointer', transition: 'all 0.12s', fontWeight: isSel ? 600 : 400,
                    }}
                    className="hover-bg-app-3"
                  >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Hint about free tier */}
      {isAutoMode && budget === 'free' && (
        <div style={{
          padding: '8px 10px', borderRadius: 8, fontSize: 11,
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)',
          color: '#a5b4fc', lineHeight: 1.55,
        }}>
          Free models are rate-limited by OpenRouter (typically ~50 req/day). No API credits needed.
        </div>
      )}

      {/* Enabled models list — collapsible */}
      {isAutoMode && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((o) => !o)}
              className="flex-v-center text-tertiary hover-text-secondary"
              style={{
                gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, padding: '2px 0',
                transition: 'color 0.12s',
              }}
          >
            <Pxi name={expanded ? 'chevron-down' : 'chevron-right'} size={12} />
            <span>{expanded ? 'Hide' : 'Customize'} enabled models ({visibleModels.filter((m) => isEnabled(m.id)).length}/{visibleModels.length})</span>
          </button>

          {expanded && (
            <div style={{
              marginTop: 8, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}>
              {visibleModels.map((m, i) => {
                const tier = TIER_COLORS[m.tier] ?? TIER_COLORS.standard
                const enabled = isEnabled(m.id)
                return (
                  <div
                    key={m.id}
                    className="flex-v-center"
                    style={{
                      gap: 10,
                      padding: '8px 12px',
                      background: enabled ? 'transparent' : 'rgba(0,0,0,0.2)',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                      transition: 'background 0.1s',
                    }}
                  >
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleModel(m.id)}
                        className="settings-toggle-sm"
                        style={{ background: enabled ? 'var(--amber)' : 'rgba(255,255,255,0.12)' }}
                      >
                        <span className="settings-toggle-sm-knob" style={{ left: enabled ? 'calc(100% - 14px)' : 2 }} />
                    </button>

                      {/* Model info */}
                      <div className="flex-1 min-w-0">
                      <div style={{
                        fontSize: 12, color: enabled ? 'var(--tx-primary)' : 'var(--tx-tertiary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.1s',
                      }}>
                        {m.name}
                      </div>
                      <div className="text-tertiary" style={{ fontSize: 10, marginTop: 1 }}>
                        {m.provider}
                      </div>
                    </div>

                    {/* Tier badge */}
                    <span style={{
                      fontSize: 9.5, padding: '2px 6px', borderRadius: 5, flexShrink: 0,
                      background: tier.bg, color: tier.color, fontWeight: 500,
                    }}>
                      {tier.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label, icon, hint, error, children,
}: {
  label: string
  icon: string
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
        <label
          className="flex-v-center settings-label"
        >
        <Pxi name={icon} size={12} className="text-tertiary" />
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex-v-center settings-error">
          <Pxi name="exclamation-triangle" size={12} />
          {error}
        </p>
      ) : hint ? (
        <p className="text-tertiary settings-hint">{hint}</p>
      ) : null}
    </div>
  )
}
