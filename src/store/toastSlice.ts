// src/store/toastSlice.ts
import type { StateCreator } from 'zustand'

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

export const createToastSlice: StateCreator<ToastSlice, [], [], ToastSlice> = (set, get) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Date.now()
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 5000)
  },
  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }))
  },
})
