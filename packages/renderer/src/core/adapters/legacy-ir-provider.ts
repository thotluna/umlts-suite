import { type IRDiagram } from '@umlts/engine'
import { IRAdapter } from '@renderer/adaptation/ir-adapter'
import { type DiagramModel } from '@renderer/core/model/nodes'
import { type IDataProvider } from '@renderer/core/contract'

/**
 * Legacy wrapper for the existing IR transformation logic.
 */
export class LegacyIRProvider implements IDataProvider<IRDiagram> {
  private readonly adapter = new IRAdapter()

  public provide(source: IRDiagram): DiagramModel {
    return this.adapter.transform(source)
  }
}
