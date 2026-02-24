import type { IRRelationship } from '@engine/generator/ir/models'
import { IRRelationshipType, IREntityType } from '@engine/generator/ir/models'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { TokenType, type Token } from '@engine/syntax/token.types'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import {
  SemanticTargetType,
  type ISemanticRule,
} from '@engine/semantics/core/semantic-rule.interface'
import type { SymbolTable } from '@engine/semantics/symbol-table'

/**
 * Validates inheritance (>>) and realization (>I) correctness between classifiers.
 */
export class GeneralizationRule implements ISemanticRule<SemanticTargetType.RELATIONSHIP> {
  public readonly id = 'rule:relationship:generalization'
  public readonly target = SemanticTargetType.RELATIONSHIP

  constructor(private readonly symbolTable: SymbolTable) {}

  public validate(rel: IRRelationship, context: ISemanticContext): void {
    const fromEntity = this.symbolTable.get(rel.from)
    const toEntity = this.symbolTable.get(rel.to)

    if (!fromEntity || !toEntity) return

    const errorToken: Token = {
      line: fromEntity.line || 1,
      column: fromEntity.column || 1,
      type: TokenType.UNKNOWN,
      value: fromEntity.name, // Use the entity name for length
    }

    // 1. RULE: Inheritance (>>) rules
    if (rel.type === IRRelationshipType.INHERITANCE) {
      if (fromEntity.type !== toEntity.type) {
        const isFromClassLike =
          fromEntity.type === IREntityType.CLASS || fromEntity.type === IREntityType.DATA_TYPE
        const isToClassLike =
          toEntity.type === IREntityType.CLASS || toEntity.type === IREntityType.DATA_TYPE
        const isFromInterfaceLike =
          fromEntity.type === IREntityType.INTERFACE || fromEntity.type === IREntityType.DATA_TYPE
        const isToInterfaceLike =
          toEntity.type === IREntityType.INTERFACE || toEntity.type === IREntityType.DATA_TYPE

        const isValidInheritance =
          (isFromClassLike && isToClassLike) || (isFromInterfaceLike && isToInterfaceLike)

        if (!isValidInheritance) {
          context.addError(
            `Invalid inheritance: ${fromEntity.type} '${fromEntity.name}' cannot extend ${toEntity.type} '${toEntity.name}'. Both must be of the same type.`,
            errorToken,
            DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
          )
        }
      }

      // RULE: Cannot extend a leaf/final entity
      if (toEntity.isLeaf || toEntity.isFinal) {
        const modifier = toEntity.isLeaf ? '{leaf}' : '<<final>>'
        context.addError(
          `Invalid inheritance: Entity '${fromEntity.name}' cannot extend '${toEntity.name}' because it is marked as ${modifier}.`,
          errorToken,
          DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
        )
      }
    }

    // 2. RULE: Realization (>I) rules
    if (rel.type === IRRelationshipType.IMPLEMENTATION) {
      // Allow Data Types as either source or target during partial resolution
      const isFromData = fromEntity.type === IREntityType.DATA_TYPE
      const isToData = toEntity.type === IREntityType.DATA_TYPE

      // A class or component can realize an interface
      const isValidSource =
        fromEntity.type === IREntityType.CLASS ||
        fromEntity.type === IREntityType.ENUMERATION ||
        isFromData

      // Must realize an interface
      const isValidTarget = toEntity.type === IREntityType.INTERFACE || isToData

      if (!isValidSource || !isValidTarget) {
        context.addError(
          `Invalid implementation: '${fromEntity.name}' (${fromEntity.type}) cannot implement '${toEntity.name}' (${toEntity.type}). Only classes/components can implement interfaces.`,
          errorToken,
          DiagnosticCode.SEMANTIC_REALIZATION_INVALID,
        )
      }
    }
  }
}
