import { TokenType } from '../../syntax/token.types'
import {
  type TypeNode,
  type Modifiers,
  type ConstraintNode,
  type NoteNode,
} from '../../syntax/nodes'
import { TypeRule } from './type.rule'
import { ConstraintRule } from './constraint.rule'
import { ModifierRule } from './modifier.rule'
import type { IParserHub } from '../core/parser.hub'
import { ASTFactory } from '../factory/ast.factory'

export interface MemberSuffix {
  typeAnnotation: TypeNode
  multiplicity?: string
  relationshipKind?: string
  isNavigable?: boolean
  label?: string
  constraints?: ConstraintNode[]
  notes?: NoteNode[]
  targetModifiers: Modifiers
}

/**
 * Regla unificada para parsear el sufijo de cualquier miembro (Atributo, Método, Parámetro).
 * Centraliza la lógica de: : [operador] [modificadores] Tipo [multiplicidad] [operador] [label] [restricciones] [notas]
 */
export class MemberSuffixRule {
  private static readonly typeRule = new TypeRule()

  public static parse(context: IParserHub): MemberSuffix {
    context.consume(TokenType.COLON, "Expected ':'")

    let relationshipKind: string | undefined
    let isNavigable: boolean | undefined

    // 1. Relación Pre-Tipo: attr : >+ Type
    if (this.isRelationshipOperator(context)) {
      const kindToken = context.advance()
      relationshipKind = kindToken.value
      isNavigable = this.isNavigable(kindToken.type)
    }

    const targetModifiers = ModifierRule.parse(context)
    const typeAnnotation = this.typeRule.parse(context)
    let multiplicity: string | undefined

    // 2. Multiplicidad compacta: Type[] o Type[1..*]
    if (context.match(TokenType.LBRACKET)) {
      let rawMultiplicity = ''
      while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
        rawMultiplicity += context.advance().value
      }
      context.consume(TokenType.RBRACKET, "Expected ']'")
      multiplicity = rawMultiplicity || '[]' // Normalizado para el validador
    }

    // 3. Relación Post-Tipo (opcional): Type >+ "label"
    if (!relationshipKind && this.isRelationshipOperator(context)) {
      const kindToken = context.advance()
      relationshipKind = kindToken.value
      isNavigable = this.isNavigable(kindToken.type)
    }

    // 4. Label o Notas (Strings)
    let label: string | undefined
    const notes: NoteNode[] = []

    while (context.match(TokenType.STRING)) {
      const stringToken = context.prev()
      const value = stringToken.value.replace(/['"]/g, '')

      // Heurística: Si hay relación y no hay label, el primer string es el label.
      // Si no, es una nota.
      if (relationshipKind && !label) {
        label = value
      } else {
        notes.push(ASTFactory.createNote(value, stringToken.line, stringToken.column))
      }
    }

    // 5. Restricciones {...}
    const constraints: ConstraintNode[] = []
    if (context.check(TokenType.LBRACE)) {
      constraints.push(ConstraintRule.parseInline(context))
    }

    return {
      typeAnnotation,
      multiplicity,
      relationshipKind,
      isNavigable,
      label,
      constraints: constraints.length > 0 ? constraints : undefined,
      notes: notes.length > 0 ? notes : undefined,
      targetModifiers,
    }
  }

  private static isRelationshipOperator(context: IParserHub): boolean {
    return context.checkAny(
      TokenType.OP_INHERIT,
      TokenType.OP_IMPLEMENT,
      TokenType.OP_COMP,
      TokenType.OP_AGREG,
      TokenType.OP_COMP_NON_NAVIGABLE,
      TokenType.OP_AGREG_NON_NAVIGABLE,
      TokenType.OP_USE,
      TokenType.OP_ASSOC,
      TokenType.OP_ASSOC_BIDIR,
      TokenType.GT,
    )
  }

  private static isNavigable(type: TokenType): boolean {
    return type !== TokenType.OP_COMP_NON_NAVIGABLE && type !== TokenType.OP_AGREG_NON_NAVIGABLE
  }
}
