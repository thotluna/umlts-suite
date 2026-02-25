import { LayoutEngine } from '@renderer/layout/layout-engine'
import { type DiagramModel } from '@renderer/core/model/nodes'
import { type DiagramConfig, type LayoutResult } from '@renderer/core/types'
import { type ILayoutStrategy } from '@renderer/core/contract'

/**
 * Legacy wrapper for the current ELK-based layout engine.
 * Specifically handles Class Diagrams as it's the only one currently supported.
 */
export class LegacyClassLayout implements ILayoutStrategy {
  private readonly engine = new LayoutEngine()

  public supports(model: DiagramModel): boolean {
    // Current engine only supports class diagrams (default)
    return model != null
  }

  public async layout(model: DiagramModel, config: DiagramConfig['layout']): Promise<LayoutResult> {
    return await this.engine.layout(model, config)
  }
}
