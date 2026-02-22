import { TokenType } from '../../syntax/token.types'
import {
  ASTNodeType,
  type RelationshipNode,
  type StatementNode,
  type ConstraintNode,
  type MemberNode,
} from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule } from '../rule.types'
import { ModifierRule } from './modifier.rule'
import { MemberRule } from './member.rule'
import { ConstraintRule } from './constraint.rule'

export class RelationshipRule implements StatementRule {
  private readonly memberRule = new MemberRule()

  public canStart(context: IParserHub): boolean {
    return context.checkAny(
      TokenType.IDENTIFIER,
      TokenType.LBRACKET,
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
  }

  public parse(context: IParserHub): StatementNode[] {
    const pos = context.getPosition()

    try {
      const fromModifiers = ModifierRule.parse(context)

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
        const kindToken = context.advance()
        const kind = kindToken.value
        const isNavigable =
          kindToken.type !== TokenType.OP_COMP_NON_NAVIGABLE &&
          kindToken.type !== TokenType.OP_AGREG_NON_NAVIGABLE

        let toMultiplicity: string | undefined

        if (context.check(TokenType.LBRACKET)) {
          toMultiplicity = this.parseMultiplicity(context)
        } else if (context.match(TokenType.STRING)) {
          toMultiplicity = context.prev().value
        }

        const toModifiers = ModifierRule.parse(context)

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

        // Optional block for members/constraints
        const constraints: ConstraintNode[] = []
        const body: MemberNode[] = []
        if (context.match(TokenType.LBRACE)) {
          while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
            // Documentación
            if (context.match(TokenType.DOC_COMMENT)) {
              context.setPendingDocs(context.prev().value)
              continue
            }

            // Comentarios
            if (context.match(TokenType.COMMENT)) {
              body.push({
                type: ASTNodeType.COMMENT,
                value: context.prev().value,
                line: context.prev().line,
                column: context.prev().column,
              })
              continue
            }

            // Restricciones anidadas { ... }
            if (context.check(TokenType.LBRACE)) {
              constraints.push(ConstraintRule.parseInline(context))
              continue
            }

            // Intentar parsear como miembro
            try {
              const posBefore = context.getPosition()
              const member = this.memberRule.parse(context)
              if (member) {
                body.push(member)
              } else {
                context.rollback(posBefore)
                // Si no es un miembro reconocido, intentamos como restricción de palabra clave
                if (context.checkAny(TokenType.KW_XOR)) {
                  constraints.push(ConstraintRule.parseInline(context))
                } else {
                  context.addError('Unrecognized content in relationship block', context.peek())
                  context.advance()
                }
              }
            } catch (_e) {
              // Fallback: tal vez sea una restricción personalizada
              constraints.push(ConstraintRule.parseInline(context))
            }
          }
          context.consume(TokenType.RBRACE, "Expected '}' at end of relationship block")
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
          isNavigable,
          label,
          constraints: constraints.length > 0 ? constraints : undefined,
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
      TokenType.OP_COMP_NON_NAVIGABLE,
      TokenType.OP_AGREG_NON_NAVIGABLE,
      TokenType.KW_EXTENDS,
      TokenType.KW_IMPLEMENTS,
      TokenType.KW_COMP,
      TokenType.KW_AGREG,
      TokenType.KW_ASSOC,
      TokenType.KW_USE,
      TokenType.GT,
    ].includes(type)
  }

  private parseMultiplicity(context: IParserHub): string {
    context.consume(TokenType.LBRACKET, '')
    let value = ''
    while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
      value += context.advance().value
    }
    context.consume(TokenType.RBRACKET, "Expected ']'")
    return value
  }
}
