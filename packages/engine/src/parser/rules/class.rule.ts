import { TokenType } from '../../syntax/token.types'
import { ASTNodeType } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { Orchestrator } from '../rule.types'
import { ModifierRule } from './modifier.rule'
import { BaseEntityRule } from './base-entity.rule'
import type { Modifiers, StatementNode } from '../../syntax/nodes'

/**
 * ClassRule: Regla especializada para el parseo de Clases.
 */
export class ClassRule extends BaseEntityRule {
  public canHandle(context: IParserHub): boolean {
    const skip = ModifierRule.countModifiers(context)
    return context.lookahead(skip).type === TokenType.KW_CLASS
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()
    let modifiers: Modifiers = ModifierRule.parse(context)

    if (!context.match(TokenType.KW_CLASS)) {
      context.rollback(pos)
      return []
    }
    const keywordToken = context.prev()

    modifiers = ModifierRule.parse(context, modifiers)

    return this.completeEntityParsing(
      context,
      orchestrator,
      ASTNodeType.CLASS,
      keywordToken,
      modifiers,
    )
  }
}
