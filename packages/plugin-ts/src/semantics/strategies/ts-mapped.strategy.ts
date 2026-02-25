import type { ITypeResolutionStrategy, TypeResolution, TypeNode } from '@umlts/engine'

export class TSMappedTypeStrategy implements ITypeResolutionStrategy {
  public resolve(typeNode: TypeNode): TypeResolution | null {
    // If the type is known to be a mapped type or an inline object type (not a generic utility)
    // we can parse its content differently. Currently returning null as a placeholder
    // until complex mapped type AST nodes are fully specified in the engine.
    if (typeNode.raw.includes('{') && typeNode.raw.includes('}')) {
      return {
        fqn: typeNode.raw,
        isPrimitive: false,
      }
    }

    return null
  }

  public isPrimitive(_typeName: string): boolean {
    return false
  }
}
