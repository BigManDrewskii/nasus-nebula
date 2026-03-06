/**
 * useVoiceInput — Web Speech API push-to-talk hook.
 *
 * Works natively in WebKit / WKWebView (Tauri macOS).
 * Returns transcript text via onTranscript callback.
 *
 * States:
 *   idle        — mic not active
 *   listening   — speech recognition running, collecting audio
 *   processing  — finalising transcript
 *   error       — recognition failed / not supported
 */

import { useState, useRef, useCallback } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

export interface VoiceInputOptions {
  /** Called with the final recognised transcript */
  onTranscript: (text: string) => void
  /** Called with interim (partial) transcript while listening */
  onInterim?: (text: string) => void
  /** Language tag e.g. "en-US". Defaults to browser locale. */
  lang?: string
}

export interface VoiceInputReturn {
  voiceState: VoiceState
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  /** Toggle listening on/off */
  toggle: () => void
  errorMessage: string | null
}

// Extend Window for webkit prefix
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition
    webkitSpeechRecognition?: typeof SpeechRecognition
  }
}

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  return (window.SpeechRecognition ?? window.webkitSpeechRecognition) ?? null
}

export function useVoiceInput(options: VoiceInputOptions): VoiceInputReturn {
  const { onTranscript, onInterim, lang } = options
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isSupported = getSpeechRecognition() !== null

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setVoiceState('idle')
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognitionCls = getSpeechRecognition()
    if (!SpeechRecognitionCls) {
      setVoiceState('error')
      setErrorMessage('Speech recognition is not supported in this environment.')
      return
    }

    // Stop any running session first
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }

    setErrorMessage(null)
    setVoiceState('listening')

    const recognition = new SpeechRecognitionCls()
    recognition.lang = lang ?? navigator.language ?? 'en-US'
    recognition.interimResults = !!onInterim
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) {
          final += r[0].transcript
        } else {
          interim += r[0].transcript
        }
      }
      if (interim && onInterim) onInterim(interim)
      if (final) {
        setVoiceState('processing')
        onTranscript(final.trim())
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        setVoiceState('idle')
      } else {
        setVoiceState('error')
        setErrorMessage(`Speech error: ${event.error}`)
      }
      recognitionRef.current = null
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setVoiceState((s) => (s === 'listening' || s === 'processing' ? 'idle' : s))
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [lang, onInterim, onTranscript])

  const toggle = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }, [voiceState, startListening, stopListening])

  return { voiceState, isSupported, startListening, stopListening, toggle, errorMessage }
}
