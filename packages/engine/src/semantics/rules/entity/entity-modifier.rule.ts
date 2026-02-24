import type { IREntity } from '@engine/generator/ir/models'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'
import { TokenType, type Token } from '@engine/syntax/token.types'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import {
  SemanticTargetType,
  type ISemanticRule,
} from '@engine/semantics/core/semantic-rule.interface'

/**
 * Validates internal consistency of an entity's hierarchy modifiers.
 */
export class EntityModifierRule implements ISemanticRule<SemanticTargetType.ENTITY> {
  public readonly id = 'rule:entity:modifiers'
  public readonly target = SemanticTargetType.ENTITY

  public validate(entity: IREntity, context: ISemanticContext): void {
    const errorToken: Token = {
      line: entity.line || 1,
      column: entity.column || 1,
      type: TokenType.UNKNOWN,
      value: entity.name,
    }

    // RULE: An entity cannot be both abstract and leaf/final
    if (entity.isAbstract && (entity.isLeaf || entity.isFinal)) {
      const modifier = entity.isLeaf ? 'leaf' : 'final'
      context.addError(
        `Invalid declaration: Entity '${entity.name}' cannot be both 'abstract' and '${modifier}'. Abstract entities must be extensible.`,
        errorToken,
        DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
      )
    }
  }
}
