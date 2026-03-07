import type { StateCreator } from 'zustand'

export interface UISlice {
  /** Config accordion state (sidebar settings sections) — DEPRECATED, kept for compatibility */
  configSections: Record<string, boolean>
  settingsOpen: boolean
  settingsTab: 'general' | 'model' | 'execution' | 'search' | 'about'

  setConfigSection: (section: string, open: boolean) => void
  openSettings: (tab?: 'general' | 'model' | 'execution' | 'search' | 'about') => void
  closeSettings: () => void
  setSettingsTab: (tab: 'general' | 'model' | 'execution' | 'search' | 'about') => void
}

export const createUISlice: StateCreator<UISlice, [['zustand/immer', never]], [], UISlice> = (set) => ({
  configSections: { model: false, parameters: false, systemPrompt: false, stats: false },
  settingsOpen: false,
  settingsTab: 'general',

  setConfigSection: (section, open) =>
    set((s) => ({
      configSections: { ...s.configSections, [section]: open },
    })),
  openSettings: (tab) => set({ settingsOpen: true, settingsTab: tab ?? 'general' }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
})
