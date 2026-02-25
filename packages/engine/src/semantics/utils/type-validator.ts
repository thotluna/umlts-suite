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
    'xor',
    'Unknown',
  ])

  /**
   * Checks if a type name is a normative UML primitive.
   */
  public static isPrimitive(typeName: string): boolean {
    const baseType = this.getBaseTypeName(typeName)
    return this.PRIMITIVES.has(baseType)
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

    // Handle union types (A | B) at the top level
    let currentDepth = 0
    let currentBracketDepth = 0
    let pipeIndex = -1
    for (let i = 0; i < typeWithoutMultiplicity.length; i++) {
      const char = typeWithoutMultiplicity[i]
      if (char === '<') currentDepth++
      else if (char === '>') currentDepth--
      else if (char === '(') currentBracketDepth++
      else if (char === ')') currentBracketDepth--
      else if (char === '|' && currentDepth === 0 && currentBracketDepth === 0) {
        pipeIndex = i
        break
      }
    }

    if (pipeIndex !== -1) {
      const parts: string[] = []
      let lastStart = 0
      let d = 0
      let b = 0
      for (let i = 0; i < typeWithoutMultiplicity.length; i++) {
        const char = typeWithoutMultiplicity[i]
        if (char === '<') d++
        else if (char === '>') d--
        else if (char === '(') b++
        else if (char === ')') b--
        else if (char === '|' && d === 0 && b === 0) {
          parts.push(typeWithoutMultiplicity.substring(lastStart, i).trim())
          lastStart = i + 1
        }
      }
      parts.push(typeWithoutMultiplicity.substring(lastStart).trim())
      return {
        baseName: 'xor',
        args: parts,
        multiplicity: multiplicityMatch ? multiplicityMatch[1] : undefined,
      }
    }

    const baseName = this.getBaseTypeName(typeWithoutMultiplicity)
    const args: string[] = []

    const start = typeWithoutMultiplicity.indexOf('<')
    const end = typeWithoutMultiplicity.lastIndexOf('>')

    if (start !== -1 && end !== -1 && end > start) {
      const argsStr = typeWithoutMultiplicity.substring(start + 1, end)
      let depth = 0
      let bracketDepth = 0
      let current = ''
      for (const char of argsStr) {
        if (char === '<') depth++
        if (char === '>') depth--
        if (char === '(') bracketDepth++
        if (char === ')') bracketDepth--

        if (char === ',' && depth === 0 && bracketDepth === 0) {
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
