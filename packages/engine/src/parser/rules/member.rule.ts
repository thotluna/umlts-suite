import type { MemberNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { Orchestrator } from '@engine/parser/rule.types'

export class MemberRule {
  /**
   * Intenta parsear un miembro delegando en la estrategia adecuada.
   */
  public parse(context: IParserHub, orchestrator: Orchestrator): MemberNode | null {
    for (const provider of context.getMemberProviders()) {
      if (provider.canHandle(context)) {
        return provider.parse(context, orchestrator)
      }
    }
    return null
  }
}
