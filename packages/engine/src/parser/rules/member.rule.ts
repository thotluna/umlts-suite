import { MemberRegistry } from './member-strategies/member.registry'
import type { MemberNode } from '../../syntax/nodes'
import type { IParserHub } from '../parser.hub'

export class MemberRule {
  /**
   * Intenta parsear un miembro delegando en la estrategia adecuada.
   */
  public parse(context: IParserHub): MemberNode | null {
    for (const provider of MemberRegistry.getProviders()) {
      if (provider.canHandle(context)) {
        return provider.parse(context)
      }
    }
    return null
  }
}
