import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure, browserErrorToFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserScreenshot } from '../../browserBridge'

/**
 * Tool for taking screenshots of the browser tab.
 */
export class BrowserScreenshotTool extends BaseTool {
  readonly name = 'browser_screenshot'
  readonly description =
    "Take a screenshot of the current browser tab and return it as a base64 image. Use to visually verify a page state, capture a result, or inspect a UI element."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      full_page: { type: 'boolean', description: 'Capture the full scrollable page (default false = viewport only).' },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
      max_dimension: { type: 'integer', description: 'Resize the longest side to this pixel value (default: 1024). Saves tokens.', default: 1024 },
      quality: { type: 'number', description: 'JPEG quality 0.0 to 1.0 (default: 0.8).', default: 0.8 },
    },
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const result = await browserScreenshot({
        tabId: args.tab_id as number | undefined,
        fullPage: Boolean(args.full_page),
      })
      
      let dataUrl = result.dataUrl
      
      // Resize/Compress if requested
      const maxDim = (args.max_dimension as number) || 1024
      const quality = (args.quality as number) || 0.8
      
      if (maxDim > 0 || quality < 1.0) {
        dataUrl = await this.resizeImage(dataUrl, maxDim, quality)
      }
      
      return toolSuccess(dataUrl)
      } catch (err) {
        return browserErrorToFailure(err) ?? toolFailure(err instanceof Error ? err.message : String(err))
      }
  }

  private async resizeImage(dataUrl: string, maxDim: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        
        if (maxDim > 0 && (width > maxDim || height > maxDim)) {
          if (width > height) {
            height = (height / width) * maxDim
            width = maxDim
          } else {
            width = (width / height) * maxDim
            height = maxDim
          }
        }
        
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = dataUrl
    })
  }
}
