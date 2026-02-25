import type { TypeNode } from '@engine/syntax/nodes'
import type { ITypeResolutionStrategy, TypeResolution } from './type-resolver.types'

/**
 * Strategy that resolves types based on the primitive types registered by language plugins.
 */
export class RegisteredPrimitiveStrategy implements ITypeResolutionStrategy {
  private readonly primitives: Set<string>

  constructor(primitives: string[]) {
    this.primitives = new Set(primitives)
  }

  public resolve(typeNode: TypeNode): TypeResolution | null {
    if (this.isPrimitive(typeNode.name)) {
      return {
        fqn: typeNode.name,
        isPrimitive: true,
      }
    }
    return null
  }

  public isPrimitive(typeName: string): boolean {
    return this.primitives.has(typeName)
  }
}
