import {
  Project,
  ClassDeclaration,
  InterfaceDeclaration,
  SyntaxKind,
  PropertyDeclaration,
  MethodDeclaration,
  PropertySignature,
  Node,
  Type,
} from 'ts-morph'

export interface BlueprintOptions {
  includeMethods?: boolean
  includeProperties?: boolean
  excludePatterns?: string[]
}

export class BlueprintExtractor {
  private project: Project
  private globalCounts: Map<string, number> = new Map()

  constructor() {
    this.project = new Project()
  }

  public addSourceFiles(patterns: string | string[]): void {
    this.project.addSourceFilesAtPaths(patterns)
  }

  public extract(): string {
    this.analyzeGlobalVersatility()

    let output = ''
    const sourceFiles = this.project.getSourceFiles()
    const packages: Map<string, string> = new Map()

    for (const sourceFile of sourceFiles) {
      const packageName = this.derivePackageName(sourceFile.getFilePath())
      let packageContent = packages.get(packageName) || ''

      sourceFile.getInterfaces().forEach((itf) => {
        packageContent += this.extractInterface(itf)
      })

      sourceFile.getClasses().forEach((cls) => {
        packageContent += this.extractClass(cls)
      })

      if (packageContent) {
        packages.set(packageName, packageContent)
      }
    }

    packages.forEach((content, name) => {
      output += `package ${name} {\n${content}}\n\n`
    })

    return output
  }

  /**
   * Phase 1: Global Scan for Versatility.
   * Counts how many times each complex type is referenced across the entire project.
   */
  private analyzeGlobalVersatility(): void {
    this.globalCounts.clear()
    const allIdentifiers = this.project
      .getSourceFiles()
      .flatMap((sf) => sf.getDescendantsOfKind(SyntaxKind.Identifier))

    allIdentifiers.forEach((id) => {
      const type = id.getType()
      if (type.isObject()) {
        const typeName = this.cleanSimpleType(type.getText())
        this.globalCounts.set(typeName, (this.globalCounts.get(typeName) || 0) + 1)
      }
    })
  }

  private extractInterface(itf: InterfaceDeclaration): string {
    const name = this.sanitizeIdentifier(itf.getName())
    const baseTypes = itf.getBaseTypes()
    const inheritance =
      baseTypes.length > 0
        ? ` >> ${baseTypes.map((t) => this.resolveTypeFQN(t, itf)).join(', ')}`
        : ''

    let body = `  interface ${name}${inheritance} {\n`

    itf.getProperties().forEach((prop) => {
      body += `    ${this.sanitizeIdentifier(prop.getName())}: ${this.resolveTypeFQN(prop.getType(), itf)}\n`
    })

    itf.getMethods().forEach((method) => {
      const params = method
        .getParameters()
        .map(
          (p) =>
            `${this.sanitizeIdentifier(p.getName())}: ${this.resolveTypeFQN(p.getType(), method)}`,
        )
        .join(', ')
      body += `    ${this.sanitizeIdentifier(method.getName())}(${params}): ${this.resolveTypeFQN(method.getReturnType(), method)}\n`
    })

    body += `  }\n\n`
    return body
  }

  private extractClass(cls: ClassDeclaration): string {
    const className = this.sanitizeIdentifier(cls.getName() || '')
    if (!className) return ''

    const baseClass = cls.getBaseClass()
    const inheritance = baseClass ? ` >> ${this.resolveTypeFQN(baseClass.getType(), cls)}` : ''

    const interfaces = cls.getImplements()
    const realization =
      interfaces.length > 0
        ? ` >I ${interfaces.map((i) => this.resolveTypeFQN(i.getType(), cls)).join(', ')}`
        : ''

    let body = `  class ${className}${inheritance}${realization} {\n`

    // Attributes and Relationships
    cls.getProperties().forEach((prop) => {
      const visibility = this.getModifierVisibility(prop)
      const type = prop.getType()
      const relOp = this.detectRelationship(prop, cls)
      const propName = this.sanitizeIdentifier(prop.getName())

      if (relOp) {
        body += `    ${visibility}${propName}: ${relOp} ${this.resolveTypeFQN(type, cls)}\n`
      } else {
        body += `    ${visibility}${propName}: ${this.resolveTypeFQN(type, cls)}\n`
      }
    })

    // Methods
    const dependencies = new Set<string>()
    cls.getMethods().forEach((method) => {
      const visibility = this.getModifierVisibility(method)
      const returnType = method.getReturnType()
      this.collectTypeDependency(returnType, dependencies, cls)

      const params = method
        .getParameters()
        .map((p) => {
          this.collectTypeDependency(p.getType(), dependencies, cls)
          return `${this.sanitizeIdentifier(p.getName())}: ${this.resolveTypeFQN(p.getType(), method)}`
        })
        .join(', ')

      const returnTypeFQN = this.resolveTypeFQN(returnType, method)
      body += `    ${visibility}${this.sanitizeIdentifier(method.getName())}(${params}): ${returnTypeFQN}\n`

      // Analyze body for local variable dependencies
      method.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
        try {
          const type = id.getType()
          this.collectTypeDependency(type, dependencies, cls)
        } catch {
          // Some identifiers might not be resolvable
        }
      })
    })

    body += `  }\n\n`

    // Internal Dependencies as UMLTS relations (Momentary Life)
    dependencies.forEach((dep) => {
      body += `  ${className} >- ${dep}\n`
    })

    return body
  }

  private collectTypeDependency(type: Type, set: Set<string>, cls: ClassDeclaration): void {
    if (type.isBoolean() || type.isString() || type.isNumber() || type.isVoid() || type.isAny()) {
      return
    }

    const typeFQN = this.resolveTypeFQN(type, cls)
    const typeNameOnly = typeFQN.split('.').pop() || typeFQN

    if (
      typeNameOnly === cls.getName() ||
      typeNameOnly === 'Object' ||
      typeNameOnly === 'Function'
    ) {
      return
    }

    // Priority: If it is already a structural part (Attribute), do NOT create an external usage relationship
    const isProperty = cls.getProperties().some((p) => {
      const propFQN = this.resolveTypeFQN(p.getType(), cls)
      return propFQN === typeFQN || propFQN === `${typeFQN}[]` || propFQN.startsWith(`${typeFQN}<`)
    })
    if (isProperty) return

    if (/^[A-Z]/.test(typeNameOnly) && !typeNameOnly.includes('<') && !typeNameOnly.includes('[')) {
      set.add(typeFQN)
    }
  }

  private detectRelationship(prop: PropertyDeclaration, cls: ClassDeclaration): string | null {
    const type = prop.getType()

    // Handle Arrays: we care about the element type
    let targetType = type
    if (type.isArray()) {
      targetType = type.getArrayElementType()!
    }

    if (
      !targetType ||
      targetType.isBoolean() ||
      targetType.isString() ||
      targetType.isNumber() ||
      targetType.getText().includes('{')
    ) {
      return null
    }

    const typeFQN = this.resolveTypeFQN(targetType, cls)
    const typeNameOnly = typeFQN.split('.').pop() || typeFQN
    if (typeNameOnly === 'Object' || typeNameOnly === 'Function') return null

    const visibility = this.getModifierVisibility(prop)

    if (visibility === '+') {
      return '>+'
    }

    const propName = prop.getName()
    const hasPublicGetter = cls.getMethods().some((m) => {
      const name = m.getName()
      const isPublic = this.getModifierVisibility(m) === '+'
      return (
        isPublic &&
        (name === propName || name === `get${propName.charAt(0).toUpperCase()}${propName.slice(1)}`)
      )
    })

    if (hasPublicGetter) {
      return '>+'
    }

    const count = this.globalCounts.get(typeNameOnly) || 0
    if (count > 2) {
      return '>+'
    }

    return '>*'
  }

  private resolveTypeFQN(type: Type, contextNode: Node): string {
    if (type.isArray()) {
      const elementType = type.getArrayElementType()
      if (elementType) {
        return `${this.resolveTypeFQN(elementType, contextNode)}[]`
      }
    }

    const text = type.getText(contextNode)

    if (type.isObject() && text.includes('<')) {
      const baseNameMatch = text.match(/^([^<]+)/)
      if (baseNameMatch) {
        const baseName = baseNameMatch[1]
        const args = type.getTypeArguments()
        if (args.length > 0) {
          const resolvedArgs = args.map((arg) => this.resolveTypeFQN(arg, contextNode)).join(', ')
          const resolvedBase = this.resolveBaseTypeFQN(type, baseName, contextNode)
          return `${resolvedBase}<${resolvedArgs}>`
        }
      }
    }

    return this.resolveBaseTypeFQN(type, text, contextNode)
  }

  private resolveBaseTypeFQN(type: Type, originalText: string, contextNode: Node): string {
    const symbol = type.getSymbol() || type.getAliasSymbol()
    if (!symbol) return this.cleanSimpleType(originalText)

    const declarations = symbol.getDeclarations()
    if (declarations.length === 0) return this.cleanSimpleType(originalText)

    const sourceFile = declarations[0].getSourceFile()
    const filePath = sourceFile.getFilePath()

    if (filePath.includes('node_modules') || filePath.includes('lib.d.ts')) {
      return this.cleanSimpleType(symbol.getName())
    }

    const typePackage = this.derivePackageName(filePath)
    const contextPackage = this.derivePackageName(contextNode.getSourceFile().getFilePath())

    const typeName = this.cleanSimpleType(symbol.getName())

    if (typePackage === contextPackage) {
      return typeName
    }

    return `${typePackage}.${typeName}`
  }

  private cleanSimpleType(type: string): string {
    let cleaned = type.replace(/import\(.*?\)\./g, '')

    // TypeScript's internal name for anonymous object literals
    if (cleaned === '__type') return 'Object'

    if (cleaned.includes('{') || cleaned.includes('=>')) {
      const baseName = cleaned.split('<')[0]
      if (baseName === cleaned) {
        return cleaned.includes('{') ? 'Object' : 'Function'
      }
      return baseName.trim()
    }

    cleaned = cleaned.replace(/,\s*/g, ', ')

    return cleaned.trim()
  }

  private sanitizeIdentifier(name: string): string {
    const keywords = ['config', 'class', 'interface', 'enum', 'package']
    if (keywords.includes(name.toLowerCase())) {
      return `_${name}`
    }
    return name
  }

  private getModifierVisibility(
    node: PropertyDeclaration | MethodDeclaration | PropertySignature,
  ): string {
    if (Node.isModifierable(node)) {
      if (node.hasModifier(SyntaxKind.PrivateKeyword)) return '-'
      if (node.hasModifier(SyntaxKind.ProtectedKeyword)) return '#'
    }
    return '+'
  }

  private derivePackageName(filePath: string): string {
    const parts = filePath.split('/')
    const name = parts[parts.length - 2] || 'root'
    return name.replace(/[^a-zA-Z0-9]/g, '_')
  }
}
