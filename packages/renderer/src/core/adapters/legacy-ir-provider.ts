import { type IRDiagram } from '@umlts/engine'
import { IRAdapter } from '../../adaptation/ir-adapter'
import { type DiagramModel } from '../model/nodes'
import { type IDataProvider } from '../contract'
import { ConfigProcessor } from '../config-processor'

/**
 * Legacy wrapper for the existing IR transformation logic.
 */
export class LegacyIRProvider implements IDataProvider<IRDiagram> {
  private readonly adapter = new IRAdapter()

  public provide(source: IRDiagram): DiagramModel {
    const model = this.adapter.transform(source)
    return {
      ...model,
      config: ConfigProcessor.normalize(source.config),
    }
  }
}
