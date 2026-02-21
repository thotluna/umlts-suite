import { MemberRegistry } from './member-strategies/member.registry'
import type { MemberNode } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'

export class MemberRule {
  /**
   * Intenta parsear un miembro delegando en la estrategia adecuada.
   */
  public parse(context: ParserContext): MemberNode | null {
    for (const provider of MemberRegistry.getProviders()) {
      if (provider.canHandle(context)) {
        return provider.parse(context)
      }
    }
    return null
  }
}
