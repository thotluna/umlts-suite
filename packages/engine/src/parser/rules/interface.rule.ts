import { TokenType } from '@engine/syntax/token.types'
import { ASTNodeType } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { Orchestrator } from '@engine/parser/rule.types'
import { BaseEntityRule } from '@engine/parser/rules/base-entity.rule'
import type { StatementNode, Modifiers } from '@engine/syntax/nodes'

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
