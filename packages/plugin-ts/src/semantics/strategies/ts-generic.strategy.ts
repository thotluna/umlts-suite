import type { ITypeResolutionStrategy, TypeResolution, TypeNode } from '@umlts/engine'

export class TSGenericResolutionStrategy implements ITypeResolutionStrategy {
  private readonly TS_UTILITY_TYPES = new Set([
    'Record',
    'Partial',
    'Omit',
    'Pick',
    'Readonly',
    'Required',
    'Exclude',
    'Extract',
    'NonNullable',
    'Promise',
    'Array',
  ])

  public resolve(typeNode: TypeNode): TypeResolution | null {
    if (typeNode.kind === 'generic' && this.TS_UTILITY_TYPES.has(typeNode.name)) {
      return {
        fqn: typeNode.raw,
        isPrimitive: true,
      }
    }

    // Also consider arrays `T[]` which parse to `kind: 'array'`
    if (typeNode.kind === 'array') {
      return {
        fqn: typeNode.raw,
        isPrimitive: this.isPrimitive(typeNode.name),
      }
    }

    return null
  }

  public isPrimitive(typeName: string): boolean {
    return this.TS_UTILITY_TYPES.has(typeName)
  }
}
