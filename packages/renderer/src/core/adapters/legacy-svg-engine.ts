import { SVGRenderer } from '@renderer/drawing/svg-renderer'
import { type DiagramConfig, type LayoutResult } from '@renderer/core/types'
import { type Theme } from '@renderer/core/theme'
import { type IDrawingEngine } from '@renderer/core/contract'

/**
 * Legacy wrapper for the existing SVG drawing logic.
 */
export class LegacySVGEngine implements IDrawingEngine<string> {
  private readonly renderer = new SVGRenderer()

  public draw(layoutResult: LayoutResult, theme: Theme, config: DiagramConfig['render']): string {
    return this.renderer.render(layoutResult, theme, config)
  }
}
