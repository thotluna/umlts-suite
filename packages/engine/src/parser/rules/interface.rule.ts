import { TokenType } from '@engine/syntax/token.types'
import { ASTNodeType } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { Orchestrator } from '@engine/parser/rule.types'
import { BaseEntityRule } from '@engine/parser/rules/base-entity.rule'
import { StereotypeApplicationRule } from '@engine/parser/rules/stereotype-application.rule'
import type { StatementNode, Modifiers, StereotypeApplicationNode } from '@engine/syntax/nodes'

/**
 * InterfaceRule: Regla especializada para el parseo de Interfaces.
 */
export class InterfaceRule extends BaseEntityRule {
  public canHandle(context: IParserHub): boolean {
    const skip = StereotypeApplicationRule.skipPrefixes(context)
    return context.lookahead(skip).type === TokenType.KW_INTERFACE
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()
    const stereotypes = StereotypeApplicationRule.parse(context)

    if (!context.match(TokenType.KW_INTERFACE)) {
      context.rollback(pos)
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
      stereotypes,
    )
  }
}
