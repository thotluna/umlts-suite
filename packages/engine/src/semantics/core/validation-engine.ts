import type { ISemanticContext } from './semantic-context.interface'
import { type ISemanticRule, type RuleTargetMap } from './semantic-rule.interface'

/**
 * Executes a registry of semantic rules over the IR Models.
 * This Engine manages rules that have no state and rely only
 * on context. It is completely decoupled from the traversal logic.
 */
export class ValidationEngine {
  private readonly rules: {
    [K in keyof RuleTargetMap]?: ISemanticRule<K>[]
  } = {}

  /**
   * Registers a semantic rule into the engine for execution.
   */
  public register<K extends keyof RuleTargetMap>(rule: ISemanticRule<K>): this {
    if (!this.rules[rule.target]) {
      this.rules[rule.target] = []
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.rules[rule.target]!.push(rule)
    return this
  }

  /**
   * Executes purely all registered rules of a specific category against a given element.
   * Completely decoupled from knowing where the element came from (AST, IRDiagram, CLI, etc).
   */
  public execute<K extends keyof RuleTargetMap>(
    target: K,
    element: RuleTargetMap[K],
    context: ISemanticContext,
  ): void {
    const targetRules = this.rules[target] ?? []
    for (const rule of targetRules) {
      rule.validate(element, context)
    }
  }

  /**
   * Clears all registered rules.
   */
  public clear(): void {
    for (const key of Object.keys(this.rules)) {
      delete this.rules[key as keyof RuleTargetMap]
    }
  }
}
