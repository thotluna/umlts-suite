import type { TypeNode } from '@engine/syntax/nodes'

/**
 * Result of a type resolution.
 */
export interface TypeResolution {
  /** The final FQN of the resolved type */
  fqn: string
  /** Whether it was resolved as a primitive */
  isPrimitive: boolean
}

/**
 * Strategy for resolving types.
 */
export interface ITypeResolutionStrategy {
  /**
   * Resolves a TypeNode into a TypeResolution.
   * Returns null if it doesn't know how to resolve it.
   */
  resolve(typeNode: TypeNode): TypeResolution | null

  /**
   * Checks if a type name is considered a primitive by this strategy.
   */
  isPrimitive(typeName: string): boolean
}
