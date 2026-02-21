/**
 * Utility for validating types and references according to UML 2.5.1.
 */
export class TypeValidator {
  /**
   * The five official UML Primitive Types from the ISO/IEC 19505-2 / OMG specification.
   */
  public static readonly PRIMITIVES = new Set([
    'Integer',
    'Boolean',
    'String',
    'UnlimitedNatural',
    'Real',
  ])

  /**
   * Checks if a type name is a normative UML primitive.
   */
  public static isPrimitive(typeName: string): boolean {
    const baseType = this.getBaseTypeName(typeName)
    // Buscamos coincidencia exacta o insensible a mayúsculas para los 5 tipos UML
    return Array.from(this.PRIMITIVES).some((p) => p.toLowerCase() === baseType.toLowerCase())
  }

  /**
   * Cleans a generic or array type to get the base entity name.
   */
  public static getBaseTypeName(typeName: string): string {
    let baseType = typeName
    // Strip array multiplicity suffix [m..n] or []
    baseType = baseType.replace(/\[.*?\]\s*$/g, '').trim()
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
  public static decomposeGeneric(typeName: string): {
    baseName: string
    args: string[]
    multiplicity?: string
  } {
    // Extract trailing array multiplicity (e.g. [1..*], [], [0..1])
    const multiplicityMatch = /\[([^\]]*?)\]\s*$/.exec(typeName)
    const multiplicity = multiplicityMatch ? multiplicityMatch[0] : undefined
    const typeWithoutMultiplicity = multiplicity
      ? typeName.slice(0, typeName.lastIndexOf(multiplicity)).trim()
      : typeName

    const baseName = this.getBaseTypeName(typeWithoutMultiplicity)
    const args: string[] = []

    const start = typeWithoutMultiplicity.indexOf('<')
    const end = typeWithoutMultiplicity.lastIndexOf('>')

    if (start !== -1 && end !== -1 && end > start) {
      const argsStr = typeWithoutMultiplicity.substring(start + 1, end)
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

    return { baseName, args, multiplicity: multiplicityMatch ? multiplicityMatch[1] : undefined }
  }

  /**
   * Decomposes a type name into its base name and enum literals.
   * Example: UserRole(ADMIN | EDITOR) -> { baseName: 'UserRole', values: ['ADMIN', 'EDITOR'] }
   */
  public static decomposeEnum(typeName: string): { baseName: string; values: string[] } {
    const baseName = this.getBaseTypeName(typeName)
    const values: string[] = []

    const start = typeName.indexOf('(')
    const end = typeName.lastIndexOf(')')

    if (start !== -1 && end !== -1 && end > start) {
      const valsStr = typeName.substring(start + 1, end)
      valsStr.split(/[|,\s]+/).forEach((v) => {
        const trimmed = v.trim()
        if (trimmed) values.push(trimmed)
      })
    }

    return { baseName, values }
  }
}
