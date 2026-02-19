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
    // Nota: El motor ya no limpia [] porque eso es específico de lenguajes como TS/Java
    // Solo manejamos el concepto UML de nombre base (remover argumentos generales si existen en el string)
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
