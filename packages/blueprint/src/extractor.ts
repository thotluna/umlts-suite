import {
  Project,
  ClassDeclaration,
  InterfaceDeclaration,
  SyntaxKind,
  PropertyDeclaration,
  MethodDeclaration,
  PropertySignature,
  Node,
} from 'ts-morph'

export interface BlueprintOptions {
  includeMethods?: boolean
  includeProperties?: boolean
  excludePatterns?: string[]
}

export class BlueprintExtractor {
  private project: Project

  constructor() {
    this.project = new Project()
  }

  public addSourceFiles(patterns: string | string[]): void {
    this.project.addSourceFilesAtPaths(patterns)
  }

  public extract(): string {
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

    // Internal Dependencies as UMLTS relations
    dependencies.forEach((dep) => {
      body += `  ${name} >- ${dep}\n`
    })

    return body + '\n'
  }

  /**
   * Collects a type as a dependency if it's a complex entity and not the class itself or a property.
   */
  private collectTypeDependency(type: Type, set: Set<string>, cls: ClassDeclaration): void {
    if (type.isBoolean() || type.isString() || type.isNumber() || type.isVoid() || type.isAny()) {
      return
    }

    const typeName = this.cleanType(type.getText())
    if (typeName === cls.getName()) return

    // Avoid adding if it's already a property
    const isProperty = cls
      .getProperties()
      .some((p) => this.cleanType(p.getType().getText()) === typeName)
    if (isProperty) return

    // Simple heuristic: if it starts with Uppercase, it's likely an entity we care about
    if (/^[A-Z]/.test(typeName) && !typeName.includes('<') && !typeName.includes('[')) {
      set.add(typeName)
    }
  }

  /**
   * Heuristic to detect relationship type using UMLTS operators.
   * >* - Composition
   * >+ - Aggregation
   * >- - Association
   */
  private detectRelationship(prop: PropertyDeclaration, cls: ClassDeclaration): string | null {
    const type = prop.getType()
    if (type.isBoolean() || type.isString() || type.isNumber() || type.isArray()) return null

    const initializer = prop.getInitializer()
    if (initializer && initializer.getText().includes('new ')) {
      return '>*' // Composition
    }

    // Check constructor assignments
    const constructors = cls.getConstructors()
    for (const ctor of constructors) {
      const text = ctor.getText()
      if (text.includes(`this.${prop.getName()} = `)) {
        const params = ctor.getParameters().map((p) => p.getName())
        const assignment = text.match(new RegExp(`this.${prop.getName()}\\s*=\\s*(\\w+)`))
        if (assignment && params.includes(assignment[1])) {
          return '>+' // Aggregation
        }
      }
    }

    return '>-' // Association / Reference
  }

  private cleanType(type: string): string {
    // Remove import("...") and keep only the class name
    // Example: import("/path/to/models").User -> User
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
