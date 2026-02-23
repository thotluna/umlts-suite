import type { IRRelationship } from '@engine/generator/ir/models'
import { IRRelationshipType } from '@engine/generator/ir/models'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { TokenType, type Token } from '@engine/syntax/token.types'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import {
  SemanticTargetType,
  type ISemanticRule,
} from '@engine/semantics/core/semantic-rule.interface'
import type { SymbolTable } from '@engine/semantics/symbol-table'

/**
 * Validates if the target of a relationship is a valid Classifier (not a package).
 */
export class PackageTargetRule implements ISemanticRule<IRRelationship> {
  public readonly id = 'rule:relationship:package-target'
  public readonly target = SemanticTargetType.RELATIONSHIP

  constructor(private readonly symbolTable: SymbolTable) {}

  public validate(rel: IRRelationship, context: ISemanticContext): void {
    if (this.symbolTable.isNamespace(rel.to)) {
      // Standard UML: You can DEPEND on a package, but not associate/inherit from it.
      const allowedWithPackages = [IRRelationshipType.DEPENDENCY]

      if (!allowedWithPackages.includes(rel.type)) {
        // Find line column if available
        const sourceEntity = this.symbolTable.get(rel.from)
        context.addError(
          `Semantic Violation: Cannot use ${rel.type} with a Package ('${rel.to}'). Packages only support Dependencies (>-).`,
          {
            line: sourceEntity?.line || 1,
            column: sourceEntity?.column || 1,
            type: TokenType.UNKNOWN,
            value: rel.toName || rel.to,
          } as Token,
          DiagnosticCode.SEMANTIC_INVALID_REFERENCE,
        )
      }
    }
  }
}
