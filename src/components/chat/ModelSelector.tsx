import { useRef, useEffect, useState, useMemo } from 'react'
import { useAppStore } from '../../store'
import { Pxi } from '../Pxi'
import { familyLabel, familyMeta } from '../../lib/models'
import { formatTokenPrice } from '../../agent/llm'
import { MODEL_REGISTRY } from '../../agent/gateway/modelRegistry'

interface ModelSelectorProps {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}

export function ModelSelector({
  value,
  onChange,
  disabled,
}: ModelSelectorProps) {
  const { 
    openRouterModels, 
    modelsLastFetched, 
    routingPreview, 
    routingMode,
    setRoutingMode,
    gateways
  } = useAppStore()

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showOnlyFree, setShowOnlyFree] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Combine and normalize models from multiple sources
  const normalizedModels = useMemo(() => {
    const list: any[] = []
    const seenIds = new Set<string>()

    // 1. Add fetched OpenRouter models (Live)
    openRouterModels.forEach(m => {
      list.push({
        id: m.id,
        name: m.name,
        description: m.description,
        contextLength: m.context_length,
        pricing: m.pricing,
        isFree: parseFloat(m.pricing?.prompt ?? '1') === 0,
        provider: familyLabel(m.id),
        source: 'OpenRouter'
      })
      seenIds.add(`openrouter:${m.id}`)
    })

    // 2. Add models from registry for other enabled gateways
    const activeGateways = gateways.filter(g => g.enabled)
    
    MODEL_REGISTRY.forEach(m => {
      activeGateways.forEach(gw => {
        const gwModelId = m.ids[gw.type]
        if (!gwModelId) return
        
        const key = `${gw.type}:${gwModelId}`
        if (seenIds.has(key)) return

        list.push({
          id: gwModelId,
          name: m.canonicalName,
          description: m.description || '',
          contextLength: m.contextWindow,
          pricing: {
            prompt: (m.inputCostPer1M / 1_000_000).toString(),
            completion: (m.outputCostPer1M / 1_000_000).toString()
          },
          isFree: m.freeOn[gw.type] || m.inputCostPer1M === 0,
          provider: m.provider || familyLabel(gwModelId),
          source: gw.label
        })
        seenIds.add(key)
      })
    })

    return list
  }, [openRouterModels, gateways])

  // Filter models based on search and "show only free" toggle
  const filteredModels = useMemo(() => {
    let list = normalizedModels
    
    if (showOnlyFree) {
      list = list.filter(m => m.isFree)
    }
    
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.id.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q) ||
        m.source.toLowerCase().includes(q)
      )
    }
    
    return list
  }, [normalizedModels, search, showOnlyFree])

  // Group filtered models by source (Gateway) then by provider (Family)
  const groupedModels = useMemo(() => {
    const sourceGroups = new Map<string, Map<string, typeof filteredModels>>()
    
    for (const m of filteredModels) {
      if (!sourceGroups.has(m.source)) {
        sourceGroups.set(m.source, new Map())
      }
      const providerGroups = sourceGroups.get(m.source)!
      if (!providerGroups.has(m.provider)) {
        providerGroups.set(m.provider, [])
      }
      providerGroups.get(m.provider)!.push(m)
    }
    
    // Sort sources alphabetically, but put OpenRouter first if it exists
    const sortedSources = Array.from(sourceGroups.keys()).sort((a, b) => {
      if (a === 'OpenRouter') return -1
      if (b === 'OpenRouter') return 1
      return a.localeCompare(b)
    })
    
    return { sortedSources, sourceGroups }
  }, [filteredModels])

  const selectedModel = normalizedModels.find(m => m.id === value)

  // Determine display label
  const displayLabel = useMemo(() => {
    if (routingMode.startsWith('auto')) {
      if (routingPreview?.displayName) {
        const budgetLabel = routingMode === 'auto-free' ? 'free' : 'paid'
        return `Auto: ${routingPreview.displayName} (${budgetLabel})`
      }
      return `Auto (${routingMode === 'auto-free' ? 'free' : 'paid'})`
    }
    return selectedModel?.name || value.split('/').pop() || value
  }, [routingMode, routingPreview, selectedModel, value])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30)
    }
  }, [open])

  const selectOption = (modelId: string) => {
    onChange(modelId)
    setRoutingMode('manual')
    setOpen(false)
    setSearch('')
  }


  return (
    <div ref={containerRef} className="relative flex items-center min-w-0">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-150 min-w-0 max-w-[180px]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}
          ${open ? 'text-white' : 'text-zinc-400'}`}
      >
        <span className="text-[11px] font-medium truncate">
          {displayLabel}
        </span>
        <Pxi 
          name="angle-down" 
          size={9} 
          className={`text-zinc-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-80 max-h-[450px] flex flex-col bg-[#161616] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Header with Search & Toggle */}
          <div className="p-3 border-b border-white/5 space-y-3 bg-black/20">
            <div className="relative">
              <Pxi name="search" size={10} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-8 pr-3 py-1.5 bg-black border border-white/5 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={showOnlyFree} 
                  onChange={(e) => setShowOnlyFree(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-3.5 h-3.5 rounded border transition-colors flex items-center justify-center ${showOnlyFree ? 'bg-amber-500 border-amber-500' : 'border-zinc-700 bg-zinc-800'}`}>
                  {showOnlyFree && <Pxi name="check" size={8} className="text-black font-bold" />}
                </div>
                <span className="text-[10px] text-zinc-400 group-hover:text-zinc-300 transition-colors">Free models only</span>
              </label>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRoutingMode('auto-free')}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all
                    ${routingMode === 'auto-free' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-zinc-800 text-zinc-500 border border-transparent hover:bg-zinc-700'}`}
                >
                  Auto Free
                </button>
                <button
                  onClick={() => setRoutingMode('auto-paid')}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all
                    ${routingMode === 'auto-paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-800 text-zinc-500 border border-transparent hover:bg-zinc-700'}`}
                >
                  Auto Paid
                </button>
              </div>
            </div>
          </div>

          {/* Model List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1 bg-black/40">
            {filteredModels.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Pxi name="search" size={24} className="opacity-20" />
                No models found
              </div>
            ) : (
              groupedModels.sortedSources.map(source => (
                <div key={source} className="mb-4 last:mb-0">
                  <div className="px-3 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center justify-between bg-white/5 rounded-md mb-1">
                    <span>{source}</span>
                    <span className="text-[8px] font-medium text-zinc-500 lowercase px-1.5 py-0.5 bg-black/30 rounded">Provider Source</span>
                  </div>
                  
                  {Array.from(groupedModels.sourceGroups.get(source)!.entries()).map(([provider, models]) => (
                    <div key={`${source}-${provider}`} className="mt-2 ml-1">
                      <div className="px-3 py-1 text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: familyMeta(models[0].id).color }} />
                        {provider}
                      </div>
                      <div className="space-y-0.5">
                        {models.map((m) => {
                          const isSelected = m.id === value && routingMode === 'manual'
                          return (
                            <button
                              key={`${source}-${m.id}`}
                              onClick={() => selectOption(m.id)}
                              className={`w-full px-3 py-2 rounded-lg text-left transition-all group flex items-center justify-between
                                ${isSelected ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs truncate ${isSelected ? 'text-amber-400 font-medium' : 'text-zinc-300'}`}>
                                    {m.name}
                                  </span>
                                  {m.isFree && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px] font-black uppercase leading-none border border-green-500/20">Free</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-zinc-500">
                                  <span className="flex items-center gap-1">
                                    <Pxi name="expand" size={7} />
                                    {Math.round(m.contextLength / 1000)}k
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <Pxi name="tag" size={7} />
                                    {formatTokenPrice(m.pricing?.prompt)}
                                  </span>
                                </div>
                              </div>
                              {isSelected && <Pxi name="check" size={10} className="text-amber-500" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/5 bg-black flex items-center justify-between text-[9px] text-zinc-600">
            <div className="flex items-center gap-3">
              <span>{filteredModels.length} models</span>
              {showOnlyFree && <span className="text-green-500/80 font-bold uppercase tracking-tighter">Filtered to Free</span>}
            </div>
            {modelsLastFetched > 0 && (
              <span>Updated {new Date(modelsLastFetched).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
