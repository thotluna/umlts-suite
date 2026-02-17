import { TokenType } from '../../syntax/token.types'
import { ASTNodeType, type RelationshipHeaderNode } from '../../syntax/nodes'
import type { ParserContext } from '../parser.context'

export class RelationshipHeaderRule {
  public parse(context: ParserContext): RelationshipHeaderNode[] {
    const relationships: RelationshipHeaderNode[] = []

    while (
      context.match(
        TokenType.OP_INHERIT,
        TokenType.OP_IMPLEMENT,
        TokenType.OP_COMP,
        TokenType.OP_AGREG,
        TokenType.OP_COMP_NON_NAVIGABLE,
        TokenType.OP_AGREG_NON_NAVIGABLE,
        TokenType.OP_USE,
        TokenType.KW_EXTENDS,
        TokenType.KW_IMPLEMENTS,
        TokenType.KW_COMP,
        TokenType.KW_AGREG,
        TokenType.KW_USE,
        TokenType.GT,
      )
    ) {
      const kindToken = context.prev()
      const kind = kindToken.value
      const isNavigable =
        kindToken.type !== TokenType.OP_COMP_NON_NAVIGABLE &&
        kindToken.type !== TokenType.OP_AGREG_NON_NAVIGABLE
      const modifiers = context.consumeModifiers()

      const targetToken = context.consume(
        TokenType.IDENTIFIER,
        'Se esperaba el nombre del objetivo de la relación',
      )
      let target = targetToken.value

      // Opcionalmente consumir argumentos de tipo: <string>
      if (context.match(TokenType.LT)) {
        target += '<'
        while (!context.check(TokenType.GT) && !context.isAtEnd()) {
          target += context.advance().value
        }
        target += context.consume(TokenType.GT, "Se esperaba '>'").value
      }

      relationships.push({
        type: ASTNodeType.RELATIONSHIP,
        kind,
        isNavigable,
        target,
        targetModifiers: modifiers,
        line: targetToken.line,
        column: targetToken.column,
      })
    }

    return relationships
  }
}
