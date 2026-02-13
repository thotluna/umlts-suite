/**
 * Utility for validating types and references.
 */
export class TypeValidator {
  private static readonly PRIMITIVES = new Set([
    'string',
    'number',
    'boolean',
    'void',
    'any',
    'unknown',
    'never',
    'object',
    'cadena',
    'fecha',
    'entero',
    'booleano',
    'int',
    'float',
    'double',
    'char',
    'horadía',
    'date',
    'time',
    'datetime',
  ])

  /**
   * Checks if a type name is a primitive.
   */
  public static isPrimitive(typeName: string): boolean {
    const baseType = typeName.replace(/[[\]]/g, '').toLowerCase()
    const cleanBaseType = baseType.includes('<')
      ? baseType.substring(0, baseType.indexOf('<'))
      : baseType

    return this.PRIMITIVES.has(cleanBaseType)
  }

  /**
   * Cleans a generic or array type to get the base entity name.
   */
  public static getBaseTypeName(typeName: string): string {
    const baseType = typeName.replace(/[[\]]/g, '')
    return baseType.includes('<') ? baseType.substring(0, baseType.indexOf('<')) : baseType
  }
}
