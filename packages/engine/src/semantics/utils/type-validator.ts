/**
 * Utility for validating types and references.
 */
export class TypeValidator {
  public static readonly PRIMITIVES = new Set([
    'string',
    'number',
    'boolean',
    'any',
    'void',
    'null',
    'undefined',
    'never',
    'unknown',
    'object',
    'symbol',
    'bigint',
    'array',
    'list',
    'set',
    'map',
    'promise',
    'observable',
    'partial',
    'pick',
    'omit',
    'record',
    'required',
    'readonly',
    'exclude',
    'extract',
    'nonnullable',
    'returntype',
  ])

  public static readonly UTILITIES = new Set([
    'partial',
    'pick',
    'omit',
    'record',
    'required',
    'readonly',
    'exclude',
    'extract',
    'nonnullable',
    'returntype',
  ])

  public static readonly COLLECTIONS = new Set(['array', 'list', 'collection', 'set', 'iterable'])

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
   * Checks if a type is a TypeScript utility.
   */
  public static isUtility(typeName: string): boolean {
    const base = this.getBaseTypeName(typeName).toLowerCase()
    return this.UTILITIES.has(base)
  }

  /**
   * Checks if a type is a collection.
   */
  public static isCollection(typeName: string): boolean {
    const base = this.getBaseTypeName(typeName).toLowerCase()
    return this.COLLECTIONS.has(base)
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

  /**
   * Decomposes a type name like "Repository<User, string>" into
   * { baseName: "Repository", arguments: ["User", "string"] }
   */
  public static decomposeGeneric(typeName: string): { baseName: string; args: string[] } {
    const baseName = this.getBaseTypeName(typeName)
    const args: string[] = []

    const start = typeName.indexOf('<')
    const end = typeName.lastIndexOf('>')

    if (start !== -1 && end !== -1 && end > start) {
      const argsStr = typeName.substring(start + 1, end)
      // Basic splitting by comma, avoiding nested generics (simple version for now)
      let depth = 0
      let current = ''
      for (const char of argsStr) {
        if (char === '<') depth++
        if (char === '>') depth--
        if (char === ',' && depth === 0) {
          args.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      if (current.trim()) args.push(current.trim())
    }

    return { baseName, args }
  }
}
