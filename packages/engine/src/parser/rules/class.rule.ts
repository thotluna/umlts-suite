import { TokenType } from '@engine/syntax/token.types'
import { ASTNodeType } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { Orchestrator } from '@engine/parser/rule.types'
import { ModifierRule } from '@engine/parser/rules/modifier.rule'
import { BaseEntityRule } from '@engine/parser/rules/base-entity.rule'
import type { Modifiers, StatementNode } from '@engine/syntax/nodes'

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
