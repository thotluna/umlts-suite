/**
 * Utility for validating types and references according to UML 2.5.1.
 */
export class TypeValidator {
  /**
   * The five official UML Primitive Types from the ISO/IEC 19505-2 / OMG specification.
   */
  public static readonly PRIMITIVES = new Set([
    'integer',
    'boolean',
    'string',
    'unlimitednatural',
    'real',
  ])

  /**
   * Checks if a type name is a normative UML primitive.
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

  /**
   * Decomposes a type name into its base name and generic arguments.
   */
  public static decomposeGeneric(typeName: string): { baseName: string; args: string[] } {
    const baseName = this.getBaseTypeName(typeName)
    const args: string[] = []

    const start = typeName.indexOf('<')
    const end = typeName.lastIndexOf('>')

    if (start !== -1 && end !== -1 && end > start) {
      const argsStr = typeName.substring(start + 1, end)
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
