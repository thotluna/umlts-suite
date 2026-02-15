import { TokenType } from '../../lexer/token.types'
import { ASTNodeType, type RelationshipHeaderNode } from '../ast/nodes'
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
        TokenType.OP_USE,
        TokenType.KW_EXTENDS,
        TokenType.KW_IMPLEMENTS,
        TokenType.KW_COMP,
        TokenType.KW_AGREG,
        TokenType.KW_USE,
        TokenType.GT,
      )
    ) {
      const kind = context.prev().value
      const targetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)
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
        target,
        targetIsAbstract,
        line: targetToken.line,
        column: targetToken.column,
      })
    }

    return relationships
  }
}
