import type { IRConstraint } from '../../generator/ir/models'

/**
 * Registry responsible for storing and deduplicating constraints during the semantic analysis session.
 * Replaces the ad-hoc constraint management in SemanticAnalyzer.
 */
export class ConstraintRegistry {
  private readonly constraints: IRConstraint[] = []

  /**
   * Adds a constraint to the registry, avoiding duplicates.
   * Duplicates are determined by matching 'kind' and 'targets'.
   * @param constraint The constraint to add.
   */
  public add(constraint: IRConstraint): void {
    // Deduplication logic extracted from SemanticAnalyzer
    const exists = this.constraints.some(
      (c) =>
        c.kind === constraint.kind &&
        JSON.stringify(c.targets) === JSON.stringify(constraint.targets),
    )
    if (!exists) {
      this.constraints.push(constraint)
    }
  }

  /**
   * Returns all registered constraints.
   */
  public getAll(): IRConstraint[] {
    return [...this.constraints]
  }

  /**
   * Clears the registry (useful for testing or reset)
   */
  public clear(): void {
    this.constraints.length = 0
  }
}
