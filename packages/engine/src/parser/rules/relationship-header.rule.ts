import { TokenType } from '@engine/syntax/token.types'
import { type RelationshipHeaderNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import { ModifierRule } from '@engine/parser/rules/modifier.rule'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

export class RelationshipHeaderRule {
  public parse(context: IParserHub): RelationshipHeaderNode[] {
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
      const modifiers = ModifierRule.parse(context)

      const targetToken = context.consume(
        TokenType.IDENTIFIER,
        'Se esperaba el nombre del objetivo de la relación',
      )
      let target = targetToken.value
      while (context.match(TokenType.DOT)) {
        target += '.' + context.consume(TokenType.IDENTIFIER, 'Identifier expected after dot').value
      }

      // Opcionalmente consumir argumentos de tipo: <string>
      if (context.match(TokenType.LT)) {
        target += '<'
        while (!context.check(TokenType.GT) && !context.isAtEnd()) {
          target += context.advance().value
        }
        target += context.consume(TokenType.GT, "Se esperaba '>'").value
      }

      relationships.push(
        ASTFactory.createRelationshipHeader(
          kind,
          target,
          isNavigable,
          targetToken.line,
          targetToken.column,
          modifiers,
        ),
      )
    }

    return relationships
  }
}
