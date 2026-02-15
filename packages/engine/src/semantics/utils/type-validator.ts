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
    'decimal',
    'binary',
  ])

  /**
   * Checks if a type name is a primitive.
   */
  public static isPrimitive(typeName: string): boolean {
    const baseType = typeName.replace(/[[\]]/g, '').toLowerCase()
    let cleanBaseType = baseType.includes('<')
      ? baseType.substring(0, baseType.indexOf('<'))
      : baseType

    if (cleanBaseType.includes('(')) {
      cleanBaseType = cleanBaseType.substring(0, cleanBaseType.indexOf('('))
    }

    return this.PRIMITIVES.has(cleanBaseType)
  }

  /**
   * Cleans a generic or array type to get the base entity name.
   */
  public static getBaseTypeName(typeName: string): string {
    let baseType = typeName.replace(/[[\]]/g, '')
    if (baseType.includes('<')) {
      baseType = baseType.substring(0, baseType.indexOf('<'))
    }
    if (baseType.includes('(')) {
      baseType = baseType.substring(0, baseType.indexOf('('))
    }
    return baseType
  }
}
