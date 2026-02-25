import { type DiagramModel } from '../model/nodes'
import { type ILayoutStrategy } from '../contract'
import { ClassLayoutStrategy } from '../strategies/class-layout-strategy'
import { type DiagramConfig, type LayoutResult } from '../types'

/**
 * Legacy wrapper for the layout engine.
 * Now delegates to the pure ClassLayoutStrategy.
 */
export class LegacyClassLayout implements ILayoutStrategy {
  private readonly strategy = new ClassLayoutStrategy()

  public supports(model: DiagramModel): boolean {
    return this.strategy.supports(model)
  }

  public async layout(model: DiagramModel, config: DiagramConfig['layout']): Promise<LayoutResult> {
    return this.strategy.layout(model, config)
  }
}
