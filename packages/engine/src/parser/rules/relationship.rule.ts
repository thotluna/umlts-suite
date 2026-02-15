import { TokenType } from '../../lexer/token.types'
import type { RelationshipNode } from '../ast/nodes'
import { ASTNodeType } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule } from '../rule.types'

export class RelationshipRule implements StatementRule {
  public parse(context: ParserContext): RelationshipNode[] | null {
    const pos = context.getPosition()

    try {
      const fromModifiers = {
        isAbstract: false,
        isStatic: false,
        isActive: false,
        isLeaf: false,
        isFinal: false,
        isRoot: false,
      }

      let found = true
      while (found) {
        found = false
        if (context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)) {
          fromModifiers.isAbstract = true
          found = true
        }
        if (context.match(TokenType.MOD_STATIC, TokenType.KW_STATIC)) {
          fromModifiers.isStatic = true
          found = true
        }
        if (context.match(TokenType.MOD_ACTIVE, TokenType.KW_ACTIVE)) {
          fromModifiers.isActive = true
          found = true
        }
        if (context.match(TokenType.MOD_LEAF, TokenType.KW_LEAF)) {
          fromModifiers.isLeaf = true
          found = true
        }
        if (context.match(TokenType.KW_FINAL)) {
          fromModifiers.isFinal = true
          found = true
        }
        if (context.match(TokenType.MOD_ROOT, TokenType.KW_ROOT)) {
          fromModifiers.isRoot = true
          found = true
        }
      }

      const fromToken = context.peek()
      if (!context.check(TokenType.IDENTIFIER)) {
        if (Object.values(fromModifiers).some((v) => v)) context.rollback(pos)
        return null
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

        const toModifiers = {
          isAbstract: false,
          isStatic: false,
          isActive: false,
          isLeaf: false,
          isFinal: false,
          isRoot: false,
        }

        let foundTo = true
        while (foundTo) {
          foundTo = false
          if (context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)) {
            toModifiers.isAbstract = true
            foundTo = true
          }
          if (context.match(TokenType.MOD_STATIC, TokenType.KW_STATIC)) {
            toModifiers.isStatic = true
            foundTo = true
          }
          if (context.match(TokenType.MOD_ACTIVE, TokenType.KW_ACTIVE)) {
            toModifiers.isActive = true
            foundTo = true
          }
          if (context.match(TokenType.MOD_LEAF, TokenType.KW_LEAF)) {
            toModifiers.isLeaf = true
            foundTo = true
          }
          if (context.match(TokenType.KW_FINAL)) {
            toModifiers.isFinal = true
            foundTo = true
          }
          if (context.match(TokenType.MOD_ROOT, TokenType.KW_ROOT)) {
            toModifiers.isRoot = true
            foundTo = true
          }
        }

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
        return null
      }

      return relationships
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
