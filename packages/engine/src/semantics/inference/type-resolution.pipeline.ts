import { IRRelationshipType } from '@engine/generator/ir/models'
import type { TypeNode } from '@engine/syntax/nodes'

/**
 * Result of resolving a type node to a specific entity relationship.
 */
export interface TypeResolution {
  targetName: string
  multiplicity?: string
  relationshipType?: IRRelationshipType
  label?: string
  isIgnored?: boolean
}

/**
 * Strategy interface for resolving types.
 * Allows decoupling the UML core from language-specific type logic (Typescript, Java, etc).
 */
export interface ITypeResolutionStrategy {
  /**
   * Attempts to resolve a TypeNode into a relationship target.
   * Returns null if the strategy cannot handle this type.
   */
  resolve(typeNode: TypeNode): TypeResolution | null

  /**
   * Determines if a type name corresponds to a primitive in this strategy's domain.
   */
  isPrimitive(typeName: string): boolean
}

/**
 * Chains multiple resolution strategies together.
 * Executes strategies in order until one provides a resolution.
 */
export class TypeResolutionPipeline implements ITypeResolutionStrategy {
  private strategies: ITypeResolutionStrategy[] = []

  constructor(strategies: ITypeResolutionStrategy[] = []) {
    this.strategies = strategies
  }

  public add(strategy: ITypeResolutionStrategy): void {
    this.strategies.push(strategy)
  }

  public resolve(typeNode: TypeNode): TypeResolution | null {
    for (const strategy of this.strategies) {
      const result = strategy.resolve(typeNode)
      if (result) {
        return result
      }
    }
    return null
  }

  public isPrimitive(typeName: string): boolean {
    return this.strategies.some((s) => s.isPrimitive(typeName))
  }
}
