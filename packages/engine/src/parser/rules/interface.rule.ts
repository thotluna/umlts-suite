import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { Orchestrator } from '../rule.types'
import { BaseEntityRule } from './base-entity.rule'
import type { StatementNode, Modifiers } from '../../syntax/nodes'

/**
 * InterfaceRule: Regla especializada para el parseo de Interfaces.
 */
export class InterfaceRule extends BaseEntityRule {
  public canHandle(context: IParserHub): boolean {
    return context.peek().type === TokenType.KW_INTERFACE
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    if (!context.match(TokenType.KW_INTERFACE)) {
      return []
    }
    const keywordToken = context.prev()

    const modifiers: Modifiers = {
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
    }

    return this.completeEntityParsing(
      context,
      orchestrator,
      ASTNodeType.INTERFACE,
      keywordToken,
      modifiers,
    )
  }
}
