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
        const typeName = this.cleanType(type.getText())
        this.globalCounts.set(typeName, (this.globalCounts.get(typeName) || 0) + 1)
      }
    })
  }

  private extractInterface(itf: InterfaceDeclaration): string {
    const name = this.sanitizeIdentifier(itf.getName())
    const baseTypes = itf.getBaseTypes()
    const inheritance =
      baseTypes.length > 0
        ? ` >> ${baseTypes.map((t) => this.cleanType(t.getText())).join(', ')}`
        : ''

    let body = `  interface ${name}${inheritance} {\n`

    itf.getProperties().forEach((prop) => {
      body += `    ${this.sanitizeIdentifier(prop.getName())}: ${this.cleanType(prop.getType().getText())}\n`
    })

    itf.getMethods().forEach((method) => {
      const params = method
        .getParameters()
        .map(
          (p) =>
            `${this.sanitizeIdentifier(p.getName())}: ${this.cleanType(p.getType().getText())}`,
        )
        .join(', ')
      body += `    ${this.sanitizeIdentifier(method.getName())}(${params}): ${this.cleanType(method.getReturnType().getText())}\n`
    })

    body += `  }\n\n`
    return body
  }

  private extractClass(cls: ClassDeclaration): string {
    const name = this.sanitizeIdentifier(cls.getName() || '')
    if (!name) return ''

    const baseClass = cls.getBaseClass()
    const inheritance = baseClass
      ? ` >> ${this.sanitizeIdentifier(this.cleanType(baseClass.getName() || ''))}`
      : ''

    const interfaces = cls.getImplements()
    const realization =
      interfaces.length > 0
        ? ` >I ${interfaces.map((i) => this.cleanType(i.getText())).join(', ')}`
        : ''

    let body = `  class ${name}${inheritance}${realization} {\n`

    // Attributes and Relationships
    cls.getProperties().forEach((prop) => {
      const visibility = this.getModifierVisibility(prop)
      const typeText = prop.getType().getText()
      const relOp = this.detectRelationship(prop, cls)
      const propName = this.sanitizeIdentifier(prop.getName())

      if (relOp) {
        body += `    ${visibility}${propName}: ${relOp} ${this.cleanType(typeText)}\n`
      } else {
        body += `    ${visibility}${propName}: ${this.cleanType(typeText)}\n`
      }
    })

    // Methods
    const dependencies = new Set<string>()
    cls.getMethods().forEach((method) => {
      const visibility = this.getModifierVisibility(method)
      const returnType = method.getReturnType().getText()
      this.collectTypeDependency(method.getReturnType(), dependencies, cls)

      const params = method
        .getParameters()
        .map((p) => {
          this.collectTypeDependency(p.getType(), dependencies, cls)
          return `${this.sanitizeIdentifier(p.getName())}: ${this.cleanType(p.getType().getText())}`
        })
        .join(', ')

      body += `    ${visibility}${this.sanitizeIdentifier(method.getName())}(${params}): ${this.cleanType(returnType)}\n`

      // Analyze body for local variable dependencies
      method.getDescendantsOfKind(SyntaxKind.Identifier).forEach((id) => {
        const type = id.getType()
        this.collectTypeDependency(type, dependencies, cls)
      })
    })

    body += `  }\n\n`

    // Internal Dependencies as UMLTS relations (Momentary Life)
    dependencies.forEach((dep) => {
      body += `  ${name} >- ${dep}\n`
    })

    return body
  }

  private collectTypeDependency(type: Type, set: Set<string>, cls: ClassDeclaration): void {
    if (type.isBoolean() || type.isString() || type.isNumber() || type.isVoid() || type.isAny()) {
      return
    }

    const typeName = this.cleanType(type.getText())
    if (typeName === cls.getName()) return

    const isProperty = cls
      .getProperties()
      .some((p) => this.cleanType(p.getType().getText()) === typeName)
    if (isProperty) return

    if (/^[A-Z]/.test(typeName) && !typeName.includes('<') && !typeName.includes('[')) {
      set.add(typeName)
    }
  }

  private detectRelationship(prop: PropertyDeclaration, cls: ClassDeclaration): string | null {
    const type = prop.getType()
    if (type.isBoolean() || type.isString() || type.isNumber() || type.isArray()) return null

    const typeName = this.cleanType(type.getText())
    const visibility = this.getModifierVisibility(prop)

    // Rule 1: Public Visibility = Aggregation (Shared/Visible)
    if (visibility === '+') {
      return '>+'
    }

    // Rule 2: Surgeon Effect (The Getter check)
    // If it is private but has a public getter, it's Aggregation
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

    // Rule 3: Versatility (Global counting)
    // If several classes reference this type, it's likely a shared component (Aggregation)
    const count = this.globalCounts.get(typeName) || 0
    if (count > 2) {
      // If it's used in and out, it's more of a shared aggregation than a private composition
      return '>+'
    }

    // Rule 4: Private/Non-exposed/Low-versatility = Composition
    return '>*'
  }

  private cleanType(type: string): string {
    // 1. Remove import(...) - also inside generics
    let cleaned = type.replace(/import\(.*?\)\./g, '')

    // 2. If it contains object literals or function signatures, simplify it
    // These are NOT supported by UMLTS grammar
    if (cleaned.includes('{') || cleaned.includes('=>')) {
      // If it's a generic with complex stuff inside, keep only the base name
      // Example: Record<string, { a: 1 }> -> Record
      const baseName = cleaned.split('<')[0]
      if (baseName === cleaned) {
        return cleaned.includes('{') ? 'Object' : 'Function'
      }
      return baseName.trim()
    }

    // 3. Normalize whitespace in generics for the UMLTS parser
    // Parser expects simple identifiers in generics
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
