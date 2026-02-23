import type { IREntity, IRRelationship, IRDiagram } from '@engine/generator/ir/models'
import type { ISemanticContext } from './semantic-context.interface'
import { SemanticTargetType, type ISemanticRule } from './semantic-rule.interface'

/**
 * Executes a registry of semantic rules over the IR Diagram.
 * This Engine manages rules that have no state and rely only
 * on context, enabling easier testing and parallel execution.
 */
export class ValidationEngine {
  private readonly entityRules: ISemanticRule<IREntity>[] = []
  private readonly relationshipRules: ISemanticRule<IRRelationship>[] = []
  private readonly diagramRules: ISemanticRule<IRDiagram>[] = []

  /**
   * Registers a semantic rule into the engine for execution.
   */
  public register<T>(rule: ISemanticRule<T>): this {
    if (rule.target === SemanticTargetType.ENTITY) {
      this.entityRules.push(rule as unknown as ISemanticRule<IREntity>)
    } else if (rule.target === SemanticTargetType.RELATIONSHIP) {
      this.relationshipRules.push(rule as unknown as ISemanticRule<IRRelationship>)
    } else if (rule.target === SemanticTargetType.DIAGRAM) {
      this.diagramRules.push(rule as unknown as ISemanticRule<IRDiagram>)
    }
    return this
  }

  /**
   * Validates an entire IRDiagram against all registered ISemanticRules.
   */
  public validate(diagram: IRDiagram, context: ISemanticContext): void {
    // 1. Entity-Level Rules
    for (const entity of diagram.entities) {
      for (const rule of this.entityRules) {
        rule.validate(entity, context)
      }
    }

    // 2. Relationship-Level Rules
    for (const rel of diagram.relationships) {
      for (const rule of this.relationshipRules) {
        rule.validate(rel, context)
      }
    }

    // 3. Diagram-Level Rules (Global checks, e.g. cross-referencing loops)
    for (const rule of this.diagramRules) {
      rule.validate(diagram, context)
    }
  }

  /**
   * Clears all registered rules.
   */
  public clear(): void {
    this.entityRules.length = 0
    this.relationshipRules.length = 0
    this.diagramRules.length = 0
  }
}
