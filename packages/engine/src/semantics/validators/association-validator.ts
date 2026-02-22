import type { IREntity } from '../../generator/ir/models'
import { IRRelationshipType, IREntityType } from '../../generator/ir/models'
import { DiagnosticCode } from '../../syntax/diagnostic.types'
import { TokenType } from '../../syntax/token.types'
import type { Token } from '../../syntax/token.types'
import type { ParserContext } from '../../parser/parser.context'
import type { SymbolTable } from '../symbol-table'

/**
 * Validator for Association-related rules (Composition, Aggregation, etc.).
 */
export class AssociationValidator {
  constructor(private readonly context: ParserContext) {}

  /**
   * Validates structural integrity of an association.
   */
  public validate(from: IREntity, to: IREntity, type: IRRelationshipType): void {
    const errorToken: Token = {
      line: from.line || 1,
      column: from.column || 1,
      type: TokenType.UNKNOWN,
      value: '',
    }

    // 1. RULE: Composition/Aggregation Source Type
    // Only Classes and Interfaces can be the 'Whole' in a strong structural relationship.
    if (type === IRRelationshipType.COMPOSITION || type === IRRelationshipType.AGGREGATION) {
      if (from.type === IREntityType.ENUMERATION) {
        this.context.addError(
          `Association Violation: An Enum ('${from.name}') cannot be the aggregate/whole in a ${type} relationship.`,
          errorToken,
          DiagnosticCode.SEMANTIC_INVALID_TYPE,
        )
      }
    }
  }

  /**
   * Validates if the target of a relationship is a valid Classifier (not a package).
   */
  public validateTarget(
    toFQN: string,
    type: IRRelationshipType,
    symbolTable: SymbolTable,
    line?: number,
    column?: number,
    targetName?: string, // Added targetName
  ): boolean {
    if (symbolTable.isNamespace(toFQN)) {
      // Standard UML: You can DEPEND on a package, but not associate/inherit from it.
      const allowedWithPackages = [IRRelationshipType.DEPENDENCY]

      if (!allowedWithPackages.includes(type)) {
        this.context.addError(
          `Semantic Violation: Cannot use ${type} with a Package ('${toFQN}'). Packages only support Dependencies (>-).`,
          {
            line: line || 1,
            column: column || 1,
            type: TokenType.UNKNOWN,
            value: targetName || '', // Use targetName for length
          } as Token,
          DiagnosticCode.SEMANTIC_INVALID_REFERENCE,
        )
        return false
      }
    }
    return true
  }
}
