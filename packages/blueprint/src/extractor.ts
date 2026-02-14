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
    cls.getMethods().forEach((method) => {
      const visibility = this.getModifierVisibility(method)
      const params = method
        .getParameters()
        .map((p) => `${p.getName()}: ${this.cleanType(p.getType().getText())}`)
        .join(', ')
      body += `    ${visibility}${method.getName()}(${params}): ${this.cleanType(method.getReturnType().getText())}\n`
    })

    body += `  }\n\n`
    return body
  }

  /**
   * Heuristic to detect relationship type.
   * o-- Agregación: Se recibe en el constructor pero se guarda.
   * *-- Composición: Se instancia dentro de la clase (new).
   * --> Asociación: Es una propiedad pero no está clara la dueñidad.
   */
  private detectRelationship(prop: PropertyDeclaration, cls: ClassDeclaration): string | null {
    const type = prop.getType()
    if (type.isBoolean() || type.isString() || type.isNumber() || type.isArray()) return null

    const initializer = prop.getInitializer()
    if (initializer && initializer.getText().includes('new ')) {
      return '*--' // Composición (creación interna)
    }

    // Check constructor assignments
    const constructors = cls.getConstructors()
    for (const ctor of constructors) {
      const text = ctor.getText()
      if (text.includes(`this.${prop.getName()} = `)) {
        // Si se asigna desde un parámetro del ctor es Agregación
        const params = ctor.getParameters().map((p) => p.getName())
        const assignment = text.match(new RegExp(`this.${prop.getName()}\\s*=\\s*(\\w+)`))
        if (assignment && params.includes(assignment[1])) {
          return 'o--'
        }
      }
    }

    return '-->' // Por defecto Asociación si es un objeto complejo
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
    return parts[parts.length - 2] || 'root'
  }
}
