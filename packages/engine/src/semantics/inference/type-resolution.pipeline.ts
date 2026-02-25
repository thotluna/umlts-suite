import type { TypeNode } from '../../syntax/nodes'
import type { ITypeResolutionStrategy, TypeResolution } from './type-resolver.types'
import { UMLTypeResolver } from './uml-type-resolver'

/**
 * Orchestrates multiple type resolution strategies.
 * It follows the Chain of Responsibility pattern: the first strategy
 * that returns a non-null result wins.
 */
export class TypeResolutionPipeline {
  private readonly strategies: ITypeResolutionStrategy[] = []

  constructor(customStrategies: ITypeResolutionStrategy[] = []) {
    // 1. Language specialization (High priority)
    this.strategies.push(...customStrategies)

    // 2. UML Standard (Fallback)
    this.strategies.push(new UMLTypeResolver())
  }

  /**
   * Resolves a TypeNode into a definitive FQN and identifies its nature.
   */
  public resolve(typeNode: TypeNode): TypeResolution {
    for (const strategy of this.strategies) {
      const result = strategy.resolve(typeNode)
      if (result) return result
    }

    // Default: Return as-is, treating it as a non-primitive reference
    return {
      fqn: typeNode.name,
      isPrimitive: this.isPrimitive(typeNode.name),
    }
  }

  /**
   * Checks if a type name is considered a primitive by any of the strategies.
   */
  public isPrimitive(typeName: string): boolean {
    return this.strategies.some((s) => s.isPrimitive(typeName))
  }
}
