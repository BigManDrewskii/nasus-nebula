import type { AppStateCreator } from './storeTypes'

export interface UISlice {
  /** Config accordion open/closed state — persisted to localStorage via layout save */
  configSections: Record<string, boolean>
  settingsOpen: boolean
  settingsTab: 'general' | 'model' | 'execution' | 'browser' | 'search' | 'about'

  setConfigSection: (section: string, open: boolean) => void
  openSettings: (tab?: 'general' | 'model' | 'execution' | 'browser' | 'search' | 'about') => void
  closeSettings: () => void
  setSettingsTab: (tab: 'general' | 'model' | 'execution' | 'browser' | 'search' | 'about') => void
}

export const createUISlice: AppStateCreator<UISlice> = (set) => ({
  configSections: { model: false, parameters: false, systemPrompt: false, stats: false },
  settingsOpen: false,
  settingsTab: 'general',

  setConfigSection: (section, open) =>
    set((s) => { s.configSections[section] = open }),
  openSettings: (tab) => set({ settingsOpen: true, settingsTab: tab ?? 'general' }),
  closeSettings: () => set({ settingsOpen: false }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
})
