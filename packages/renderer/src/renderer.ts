import type { IRDiagram } from '@umlts/engine'
import type { DiagramConfig } from './core/types'
import type { Theme } from './core/theme'
import { DiagramRenderer } from './core/diagram-renderer'
import { IRAdapter } from './adaptation/ir-adapter'
import { ClassLayoutStrategy } from './core/strategies/class-layout-strategy'
import { SVGRenderer } from './drawing/svg-renderer'

export interface RenderOptions {
  theme?: 'light' | 'dark' | Theme
  config?: DiagramConfig
}

/**
 * UMLRenderer: The high-level orchestrator of the rendering pipeline.
 * Now acts as a thin wrapper around DiagramRenderer for backward compatibility.
 */
export class UMLRenderer {
  private readonly orchestrator: DiagramRenderer<IRDiagram, string>

  constructor() {
    this.orchestrator = new DiagramRenderer(
      new IRAdapter(),
      new ClassLayoutStrategy(),
      new SVGRenderer(),
    )
  }

  /**
   * Renders the given IR into an SVG string.
   */
  public async render(ir: IRDiagram, options: RenderOptions = {}): Promise<string> {
    return this.orchestrator.render(ir, options)
  }
}
