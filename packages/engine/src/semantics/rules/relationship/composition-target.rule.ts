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
 * Validates Composition and Aggregation structural rules.
 */
export class CompositionTargetRule implements ISemanticRule<IRRelationship> {
  public readonly id = 'rule:relationship:composition-target'
  public readonly target = SemanticTargetType.RELATIONSHIP

  constructor(private readonly symbolTable: SymbolTable) {}

  public validate(rel: IRRelationship, context: ISemanticContext): void {
    if (
      rel.type !== IRRelationshipType.COMPOSITION &&
      rel.type !== IRRelationshipType.AGGREGATION
    ) {
      return
    }

    const fromEntity = this.symbolTable.get(rel.from)
    if (!fromEntity) return

    const errorToken: Token = {
      line: fromEntity.line || 1,
      column: fromEntity.column || 1,
      type: TokenType.UNKNOWN,
      value: '',
    }

    // 1. RULE: Composition/Aggregation Source Type
    // Only Classes and Interfaces can be the 'Whole' in a strong structural relationship.
    if (fromEntity.type === IREntityType.ENUMERATION) {
      context.addError(
        `Association Violation: An Enum ('${fromEntity.name}') cannot be the aggregate/whole in a ${rel.type} relationship.`,
        errorToken,
        DiagnosticCode.SEMANTIC_INVALID_TYPE,
      )
    }
  }
}
