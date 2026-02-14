import { TokenType } from '../../lexer/token.types'
import type { RelationshipNode } from '../ast/nodes'
import { ASTNodeType } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule } from '../rule.types'

export class RelationshipRule implements StatementRule {
  public parse(context: ParserContext): RelationshipNode | null {
    const pos = context.getPosition()

    try {
      const fromIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)
      const fromToken = context.peek()
      if (!context.check(TokenType.IDENTIFIER)) {
        if (fromIsAbstract) context.rollback(pos)
        return null
      }
      let from = context.consume(TokenType.IDENTIFIER, 'Se esperaba un identificador').value

      // Soporte para FQN en el origen
      while (context.match(TokenType.DOT)) {
        from +=
          '.' +
          context.consume(TokenType.IDENTIFIER, 'Se esperaba un identificador después del punto')
            .value
      }

      let fromMultiplicity: string | undefined

      if (context.check(TokenType.LBRACKET)) {
        fromMultiplicity = this.parseMultiplicity(context)
      } else if (context.match(TokenType.STRING)) {
        fromMultiplicity = context.prev().value
      }

      // El siguiente token debe ser un tipo de relación válido
      if (!this.isRelationshipType(context.peek().type)) {
        context.rollback(pos)
        return null
      }

      const kind = context.advance().value
      let toMultiplicity: string | undefined

      if (context.check(TokenType.LBRACKET)) {
        toMultiplicity = this.parseMultiplicity(context)
      } else if (context.match(TokenType.STRING)) {
        toMultiplicity = context.prev().value
      }

      const toIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)
      let to = context.consume(
        TokenType.IDENTIFIER,
        'Se esperaba el nombre del objetivo de la relación',
      ).value

      // Soporte para FQN en el destino
      while (context.match(TokenType.DOT)) {
        to +=
          '.' +
          context.consume(TokenType.IDENTIFIER, 'Se esperaba un identificador después del punto')
            .value
      }

      // Soporte para genéricos en el destino de la relación: B<T>
      if (context.match(TokenType.LT)) {
        to += '<'
        while (!context.check(TokenType.GT) && !context.isAtEnd()) {
          to += context.advance().value
        }
        to += context.consume(TokenType.GT, "Se esperaba '>'").value
      }

      let label: string | undefined
      if (context.match(TokenType.COLON)) {
        label = context.consume(
          TokenType.STRING,
          'Se esperaba una cadena de texto para la etiqueta',
        ).value
      }

      return {
        type: ASTNodeType.RELATIONSHIP,
        from,
        fromIsAbstract,
        fromMultiplicity,
        to, // Ahora usamos la variable 'to' que incluye genéricos y FQNs
        toIsAbstract,
        toMultiplicity,
        kind,
        label,
        docs: context.consumePendingDocs(),
        line: fromToken.line,
        column: fromToken.column,
      }
    } catch (_e) {
      context.rollback(pos)
      return null
    }
  }

  private isRelationshipType(type: TokenType): boolean {
    return [
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
    ].includes(type)
  }

  private parseMultiplicity(context: ParserContext): string {
    let value = context.consume(TokenType.LBRACKET, '').value
    while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
      value += context.advance().value
    }
    value += context.consume(TokenType.RBRACKET, "Se esperaba ']'").value
    return value
  }
}
