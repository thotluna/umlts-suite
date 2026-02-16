import { TokenType } from '../../lexer/token.types'
import type { StatementNode, RelationshipNode } from '../ast/nodes'
import { ASTNodeType } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule, Orchestrator } from '../rule.types'

export class RelationshipRule implements StatementRule {
  public canStart(context: ParserContext): boolean {
    return (
      context.check(TokenType.IDENTIFIER) ||
      context.checkAny(
        TokenType.MOD_ABSTRACT,
        TokenType.KW_ABSTRACT,
        TokenType.MOD_STATIC,
        TokenType.KW_STATIC,
        TokenType.MOD_ACTIVE,
        TokenType.KW_ACTIVE,
        TokenType.MOD_LEAF,
        TokenType.KW_LEAF,
        TokenType.KW_FINAL,
        TokenType.MOD_ROOT,
        TokenType.KW_ROOT,
      )
    )
  }

  public parse(context: ParserContext, _orchestrator: Orchestrator): StatementNode[] {
    const pos = context.getPosition()

    try {
      const fromModifiers = context.consumeModifiers()

      const fromToken = context.peek()
      if (!context.check(TokenType.IDENTIFIER)) {
        if (Object.values(fromModifiers).some((v) => v)) context.rollback(pos)
        return []
      }
      let from = context.consume(TokenType.IDENTIFIER, 'Identifier expected').value

      // Support for FQN on origin
      while (context.match(TokenType.DOT)) {
        from += '.' + context.consume(TokenType.IDENTIFIER, 'Identifier expected after dot').value
      }

      let fromMultiplicity: string | undefined

      if (context.check(TokenType.LBRACKET)) {
        fromMultiplicity = this.parseMultiplicity(context)
      } else if (context.match(TokenType.STRING)) {
        fromMultiplicity = context.prev().value
      }

      const relationships: RelationshipNode[] = []

      while (this.isRelationshipType(context.peek().type)) {
        const kind = context.advance().value
        let toMultiplicity: string | undefined

        if (context.check(TokenType.LBRACKET)) {
          toMultiplicity = this.parseMultiplicity(context)
        } else if (context.match(TokenType.STRING)) {
          toMultiplicity = context.prev().value
        }

        const toModifiers = context.consumeModifiers()

        let to = context.consume(TokenType.IDENTIFIER, 'Target entity name expected').value

        // Support for FQN on destination
        while (context.match(TokenType.DOT)) {
          to += '.' + context.consume(TokenType.IDENTIFIER, 'Identifier expected after dot').value
        }

        // Support for generics on destination: B<T>
        if (context.match(TokenType.LT)) {
          to += '<'
          while (!context.check(TokenType.GT) && !context.isAtEnd()) {
            to += context.advance().value
          }
          to += context.consume(TokenType.GT, "Expected '>'").value
        }

        // Optional label (only for the link between current 'from' and 'to')
        let label: string | undefined
        if (context.match(TokenType.COLON)) {
          label = context.consume(TokenType.STRING, 'Label string expected').value
        }

        relationships.push({
          type: ASTNodeType.RELATIONSHIP,
          from,
          fromModifiers,
          fromMultiplicity,
          to,
          toModifiers,
          toMultiplicity,
          kind,
          label,
          docs: context.consumePendingDocs(),
          line: fromToken.line,
          column: fromToken.column,
        })

        // Para el encadenamiento, el destino actual es el origen del siguiente
        from = to
        // Las multiplicidades y abstracción del nuevo 'from' deben resetearse o Parsearse de nuevo si el lenguaje lo permite
        // En una cadena A [1] >> [2] B [3] >> [4] C:
        // Rel1: A[1] >> [2] B
        // Rel2: B[3] >> [4] C
        // Necesitamos intentar parsear una nueva multiplicidad para el 'from' si existe
        fromMultiplicity = undefined
        if (context.check(TokenType.LBRACKET)) {
          fromMultiplicity = this.parseMultiplicity(context)
        }
      }

      if (relationships.length === 0) {
        context.rollback(pos)
        return []
      }

      return relationships
    } catch (_e) {
      context.rollback(pos)
      return []
    }
  }

  private isRelationshipType(type: TokenType): boolean {
    return [
      TokenType.OP_INHERIT,
      TokenType.OP_IMPLEMENT,
      TokenType.OP_COMP,
      TokenType.OP_AGREG,
      TokenType.OP_ASSOC,
      TokenType.OP_ASSOC_BIDIR,
      TokenType.OP_USE,
      TokenType.KW_EXTENDS,
      TokenType.KW_IMPLEMENTS,
      TokenType.KW_COMP,
      TokenType.KW_AGREG,
      TokenType.KW_ASSOC,
      TokenType.KW_USE,
      TokenType.GT,
    ].includes(type)
  }

  private parseMultiplicity(context: ParserContext): string {
    context.consume(TokenType.LBRACKET, '')
    let value = ''
    while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
      value += context.advance().value
    }
    context.consume(TokenType.RBRACKET, "Expected ']'")
    return value
  }
}
