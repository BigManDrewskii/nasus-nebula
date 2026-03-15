// src/store/toastSlice.ts
import type { AppStateCreator } from './storeTypes'

export interface ToastState {
  id: number
  message: string
  type: 'amber' | 'red' | 'green'
}

export interface ToastSlice {
  toasts: ToastState[]
  addToast: (message: string, type: ToastState['type']) => void
  removeToast: (id: number) => void
}

export const createToastSlice: AppStateCreator<ToastSlice> = (set, get) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Date.now()
    set((state) => { state.toasts.push({ id, message, type }) })
    setTimeout(() => get().removeToast(id), 5000)
  },
  removeToast: (id) => {
    set((state) => { state.toasts = state.toasts.filter((t) => t.id !== id) })
  },
})
