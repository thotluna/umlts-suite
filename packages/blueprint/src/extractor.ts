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

    for (const sourceFile of sourceFiles) {
      const packageName = this.derivePackageName(sourceFile.getFilePath())
      output += `package ${packageName} {\n`

      sourceFile.getInterfaces().forEach((itf) => {
        output += this.extractInterface(itf)
      })

      sourceFile.getClasses().forEach((cls) => {
        output += this.extractClass(cls)
      })

      output += `}\n\n`
    }

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
    const name = itf.getName()
    const baseTypes = itf.getBaseTypes()
    const inheritance =
      baseTypes.length > 0
        ? ` >> ${baseTypes.map((t) => this.cleanType(t.getText())).join(', ')}`
        : ''

    let body = `  interface ${name}${inheritance} {\n`

    itf.getProperties().forEach((prop) => {
      body += `    ${prop.getName()}: ${this.cleanType(prop.getType().getText())}\n`
    })

    itf.getMethods().forEach((method) => {
      const params = method
        .getParameters()
        .map((p) => `${p.getName()}: ${this.cleanType(p.getType().getText())}`)
        .join(', ')
      body += `    ${method.getName()}(${params}): ${this.cleanType(method.getReturnType().getText())}\n`
    })

    body += `  }\n\n`
    return body
  }

  private extractClass(cls: ClassDeclaration): string {
    const name = cls.getName()
    if (!name) return ''

    const baseClass = cls.getBaseClass()
    const inheritance = baseClass ? ` >> ${this.cleanType(baseClass.getName() || '')}` : ''

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

      if (relOp) {
        body += `    ${visibility}${prop.getName()}: ${relOp} ${this.cleanType(typeText)}\n`
      } else {
        body += `    ${visibility}${prop.getName()}: ${this.cleanType(typeText)}\n`
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
          return `${p.getName()}: ${this.cleanType(p.getType().getText())}`
        })
        .join(', ')

      body += `    ${visibility}${method.getName()}(${params}): ${this.cleanType(returnType)}\n`

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

    return body + '\n'
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
    return type.replace(/import\(.*?\)\./g, '').replace(/\[\]/g, '[]')
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
