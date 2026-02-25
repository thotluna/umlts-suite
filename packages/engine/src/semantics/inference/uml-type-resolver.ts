import type { TypeNode } from '../../syntax/nodes'
import type { ITypeResolutionStrategy, TypeResolution } from './type-resolver.types'

/**
 * Standard UML 2.5.1 Primitive Resolver.
 * Handles the pure UML primitive types only.
 * Does NOT know about Java, TypeScript, or other implementation languages.
 */
export class UMLTypeResolver implements ITypeResolutionStrategy {
  // UML 2.5 Standard Primitive Types (UML::PrimitiveTypes)
  private readonly primitives = new Set([
    'Boolean',
    'Integer',
    'String',
    'UnlimitedNatural',
    'Real',
  ])

  /**
   * UML does not have generic collections or utility wrappers in its core definition
   * the same way programming languages do. For UML, if it's not a primitive,
   * it's likely a reference to another Classifier.
   */
  public resolve(_typeNode: TypeNode): TypeResolution | null {
    // UML Core doesn't do mapping. That's a language projection.
    // So this resolver returns null for everything, delegating to the next strategy
    return null
  }

  public isPrimitive(typeName: string): boolean {
    return this.primitives.has(typeName)
  }
}
