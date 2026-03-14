/**
 * BrowserAnalyzeScreenshotTool — Vision-based page analysis.
 *
 * Captures the current browser screenshot and sends it to a vision-capable
 * LLM to answer a question about the page layout or content.
 * This makes browser automation more robust than relying on CSS selectors alone.
 */

import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserScreenshot } from '../../browserBridge'
import { useAppStore } from '../../../store'
import { createLogger } from '../../../lib/logger'

const log = createLogger('BrowserAnalyzeScreenshotTool')

export class BrowserAnalyzeScreenshotTool extends BaseTool {
  readonly name = 'browser_analyze_screenshot'
  readonly description =
    'Capture the current browser screenshot and analyze it with a vision model to answer a question about the page content or layout. Use this to locate elements, read text, or understand page structure when CSS selectors are unreliable.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description:
          'The question to ask about the screenshot (e.g. "Where is the Login button?", "What is the main headline?", "What error message is shown?").',
      },
      full_page: {
        type: 'boolean',
        description: 'Capture the full scrollable page instead of just the viewport (default: false).',
      },
    },
    required: ['question'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const question = args.question as string
    if (!question?.trim()) {
      return toolFailure("The 'question' parameter is required.")
    }

    // 1. Take the screenshot
    let dataUrl: string
    try {
      const result = await browserScreenshot({ fullPage: Boolean(args.full_page) })
      if (!result?.dataUrl) {
        return toolFailure('Failed to capture screenshot — browser may not be active.')
      }
      dataUrl = result.dataUrl
    } catch (err) {
      return toolFailure(`Screenshot failed: ${err instanceof Error ? err.message : String(err)}`)
    }

    // 2. Pick a vision-capable model and resolve gateway credentials
    const store = useAppStore.getState()
    const conn = store.resolveConnection()
    const { apiKey, apiBase } = conn
    const currentModel = conn.model || store.model

    if (!apiKey) {
      return toolFailure('No API key configured. Cannot call vision model.')
    }

    // Prefer the currently selected model if it is vision-capable.
    // Fall back to known vision models available on OpenRouter.
    const isVisionCapable =
      currentModel.includes('gpt-4o') ||
      currentModel.includes('gpt-4.1') ||
      currentModel.includes('claude-3') ||
      currentModel.includes('claude-sonnet') ||
      currentModel.includes('claude-opus') ||
      currentModel.includes('gemini') ||
      currentModel.includes('vision')

    const visionModel = isVisionCapable ? currentModel : 'deepseek-chat'

    // 3. Call the vision model via a direct fetch (multipart content)
    try {
      const base = (apiBase ?? 'https://api.deepseek.com/v1').replace(/\/$/, '')
      const url = `${base}/chat/completions`

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(conn.extraHeaders ?? {}),
      }

      const body = JSON.stringify({
        model: visionModel,
        max_tokens: 1024,
        stream: false,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: dataUrl, detail: 'auto' },
              },
              {
                type: 'text',
                text: question,
              },
            ],
          },
        ],
      })

      const resp = await fetch(url, { method: 'POST', headers, body })
      if (!resp.ok) {
        const errText = await resp.text().catch(() => '')
        log.error(`Vision API error ${resp.status}`, undefined, { body: errText })
        return toolFailure(`Vision model request failed (HTTP ${resp.status}): ${errText.slice(0, 300)}`)
      }

      const json = await resp.json()
      const answer = (json?.choices?.[0]?.message?.content ?? '').trim()

      if (!answer) {
        return toolFailure('Vision model returned an empty response.')
      }

      return toolSuccess(answer)
    } catch (err) {
      log.error('Vision model call failed', err instanceof Error ? err : new Error(String(err)))
      return toolFailure(`Vision model call failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
}
