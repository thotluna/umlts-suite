import * as fs from 'fs'
import * as path from 'path'

interface ImportMap {
  [typeName: string]: {
    fullPackage: string
    isExternal: boolean
  }
}

interface Entity {
  name: string
  kind: 'class' | 'interface'
  package: string
  members: string[]
  relations: Array<{ target: string; type: string; label?: string }>
}

export class SurgeonExtractor {
  private fqnMap: ImportMap = {}
  private packages: Map<string, Entity[]> = new Map()
  private currentPackage: string = ''

  /**
   * Phase -1 & 0: Setup context and scan imports
   */
  public scanFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    this.currentPackage = this.derivePackage(filePath)

    // Merge imports into global fqnMap
    const fileImports = this.extractImports(lines, filePath)
    Object.assign(this.fqnMap, fileImports)

    this.extractEntities(lines)
  }

  public getOutput(): string {
    return this.generateUMLTS()
  }

  private derivePackage(filePath: string): string {
    const parts = filePath.split(path.sep)
    const srcIndex = parts.lastIndexOf('src')
    if (srcIndex !== -1 && parts.length > srcIndex + 2) {
      return parts.slice(srcIndex + 1, -1).join('.')
    }
    if (srcIndex !== -1 && parts.length > srcIndex + 1) {
      return parts[srcIndex + 1]
    }
    return 'default'
  }

  private extractImports(lines: string[], currentPath: string): ImportMap {
    const map: ImportMap = {}
    const importRegex = /import\s+(?:type\s+)?\{?([^}]*)\}?\s+from\s+['"](.*)['"]/

    lines.forEach((line) => {
      const match = line.match(importRegex)
      if (match) {
        const types = match[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        const importPath = match[2]
        const isExternal = !importPath.startsWith('.')

        let pkg = 'external'
        if (!isExternal) {
          const absolutePath = path.resolve(path.dirname(currentPath), importPath)
          pkg = this.derivePackage(absolutePath)
          if (importPath.includes('ir/')) pkg = 'ir'
          if (importPath.includes('ast/')) pkg = 'ast'
          if (importPath.includes('lexer/')) pkg = 'lexer'
          if (importPath.includes('parser/')) pkg = 'parser'
        }

        types.forEach((t) => {
          map[t] = { fullPackage: pkg, isExternal }
        })
      }
    })
    return map
  }

  private extractEntities(lines: string[]): void {
    let currentEntity: Entity | null = null
    let braceCount = 0
    let inMethodSignature = false

    const classRegex =
      /(?:export\s+)?(abstract\s+)?class\s+(\w+)\s*(?:extends\s+(\w+))?\s*(?:implements\s+([\w\s,]+))?/
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/

    const memberRegex =
      /^\s*(private|public|protected|readonly)?\s*(static\s+)?(readonly\s+)?(\w+)(?:!|\?)?:\s*([^{;=]+)/

    const methodRegex =
      /^\s*(public|private|protected)?\s*(static\s+)?(abstract\s+)?(?:async\s+)?(\w+)\(([^)]*)\)(?::\s*([^{;=]+))?/

    lines.forEach((line) => {
      const cleanLine = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')
      const trimmedLine = cleanLine.trim()
      if (!trimmedLine) return

      const opens = (cleanLine.match(/\{/g) || []).length
      const closes = (cleanLine.match(/\}/g) || []).length
      const parenOpens = (cleanLine.match(/\(/g) || []).length
      const parenCloses = (cleanLine.match(/\)/g) || []).length

      if (braceCount === 0) {
        const classMatch = cleanLine.match(classRegex)
        if (classMatch) {
          currentEntity = {
            name: classMatch[2],
            kind: 'class',
            package: this.currentPackage,
            members: [],
            relations: [],
          }
          if (!this.packages.has(this.currentPackage)) this.packages.set(this.currentPackage, [])
          this.packages.get(this.currentPackage)!.push(currentEntity)

          if (classMatch[3]) {
            const fqn = this.resolveFQN(classMatch[3])
            currentEntity.relations.push({ target: fqn, type: '>>' })
          }
          braceCount += opens
          braceCount -= closes
          return
        }

        const interfaceMatch = cleanLine.match(interfaceRegex)
        if (interfaceMatch) {
          currentEntity = {
            name: interfaceMatch[1],
            kind: 'interface',
            package: this.currentPackage,
            members: [],
            relations: [],
          }
          if (!this.packages.has(this.currentPackage)) this.packages.set(this.currentPackage, [])
          this.packages.get(this.currentPackage)!.push(currentEntity)
          braceCount += opens
          braceCount -= closes
          return
        }
      }

      if (currentEntity && braceCount === 1) {
        if (!inMethodSignature) {
          const isMethod = cleanLine.includes('(')
          const methodMatch = cleanLine.match(methodRegex)
          const memberMatch = cleanLine.match(memberRegex)

          if (isMethod) {
            if (methodMatch) {
              const name = methodMatch[4]
              const isIgnored = [
                'constructor',
                'if',
                'for',
                'while',
                'switch',
                'return',
                'await',
                'static',
                'abstract',
                'async',
              ].includes(name)

              if (!isIgnored) {
                const vis = this.mapVisibility(methodMatch[1] || 'public')
                const isStatic = methodMatch[2] ? '$ ' : ''
                const isAbstract = methodMatch[3] ? '* ' : ''
                const rawParams = methodMatch[5].trim()
                const cleanParams = this.cleanParamsForDSL(rawParams)
                const rawReturnType = (methodMatch[6] || 'void').trim()
                const returnType = this.resolveTypesInText(this.cleanTypeForDSL(rawReturnType))

                const methodSig = `${name}(`
                if (!currentEntity.members.some((m) => m.includes(methodSig))) {
                  currentEntity.members.push(
                    `${vis}${isStatic}${isAbstract}${name}(${cleanParams}): ${returnType}`,
                  )
                  this.processTypesInSignature(currentEntity, `${rawParams} ${rawReturnType}`)
                }
              }
            } else {
              // Potential start of multi-line method
              const partialMatch = cleanLine.match(
                /^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:abstract\s+)?(?:async\s+)?(\w+)\s*\(/,
              )
              if (partialMatch) {
                const name = partialMatch[1]
                if (!['if', 'for', 'while', 'switch'].includes(name)) {
                  // We'll skip detailed extraction for now, but we mark that we are in a signature
                  // and we skip capturing the name as a property.
                }
              }
            }
            if (parenOpens > parenCloses) inMethodSignature = true
          } else if (memberMatch) {
            const vis = this.mapVisibility(memberMatch[1])
            const isStatic = memberMatch[2] ? '$ ' : ''
            const name = memberMatch[4]
            if (!['static', 'readonly', 'private', 'public', 'protected'].includes(name)) {
              const rawType = memberMatch[5].trim()
              const cleanType = this.resolveTypesInText(this.cleanTypeForDSL(rawType))

              const baseType = rawType.split(/[<>[\]|\s]/)[0]
              const fqn = this.resolveFQN(baseType)
              if (fqn.includes('.') && !this.isExternal(baseType)) {
                if (!currentEntity.relations.find((r) => r.target === fqn && r.label === name)) {
                  currentEntity.relations.push({ target: fqn, type: '>+', label: name })
                }
              }
              const safeName = name === 'config' ? 'cfg' : name
              const memberStr = `${vis}${isStatic}${safeName}: ${cleanType}`
              if (
                !currentEntity.members.some(
                  (m) => m.split(':')[0].trim() === `${vis}${isStatic}${safeName}`,
                )
              ) {
                currentEntity.members.push(memberStr)
              }
            }
          }
        } else {
          // Inside multi-line signature
          if (parenCloses > parenOpens) inMethodSignature = false
        }
      }

      braceCount += opens
      braceCount -= closes
      if (braceCount <= 0) {
        braceCount = 0
        currentEntity = null
      }
    })
  }

  private cleanParamsForDSL(params: string): string {
    if (!params) return ''
    const parts = this.splitRespectingNesting(params, ',')
    return parts
      .map((p) => p.trim())
      .filter((p) => p.includes(':'))
      .map((p) => {
        const [nameType] = p.split('=')
        const [name, type] = nameType.split(/:(.+)/)
        const cleanType = this.resolveTypesInText(this.cleanTypeForDSL(type))
        return `${name.replace('?', '').trim()}: ${cleanType}`
      })
      .join(', ')
  }

  /**
   * Identifies type names in a complex string (generics, arrays, etc.)
   * and replaces them with their FQN if available.
   */
  private resolveTypesInText(text: string): string {
    if (!text) return text
    // Regex matches identifiers that look like type names
    return text.replace(/\b[a-zA-Z0-9_$]+\b/g, (match) => {
      // Avoid resolving primitives or already qualified names
      if (
        ['string', 'number', 'boolean', 'void', 'any', 'unknown', 'Object', 'Record'].includes(
          match,
        )
      ) {
        return match
      }
      return this.resolveFQN(match)
    })
  }

  private splitRespectingNesting(str: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let depth = 0
    let braceDepth = 0

    for (let i = 0; i < str.length; i++) {
      const char = str[i]
      if (char === '<') depth++
      if (char === '>') depth--
      if (char === '{') braceDepth++
      if (char === '}') braceDepth--

      if (char === delimiter && depth === 0 && braceDepth === 0) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  private processTypesInSignature(entity: Entity, signature: string): void {
    const words = signature.split(/[^a-zA-Z0-9._$]+/).filter((w) => w.length > 2)
    words.forEach((word) => {
      if (word === 'this' || word.startsWith('this.')) return
      const fqn = this.resolveFQN(word)
      if (fqn.includes('.') && !this.isExternal(word)) {
        const isInheritance = entity.relations.find((r) => r.target === fqn && r.type === '>>')
        const isStructural = entity.relations.find((r) => r.target === fqn && r.type === '>+')
        const isUsage = entity.relations.find((r) => r.target === fqn && r.type === '>-')
        if (!isInheritance && !isStructural && !isUsage) {
          entity.relations.push({ target: fqn, type: '>-' })
        }
      }
    })
  }

  private resolveFQN(typeName: string): string {
    const base = typeName.split(/[<>[\]]/)[0]
    const info = this.fqnMap[base]
    if (info) {
      const suffix = typeName.includes('<') ? typeName.substring(typeName.indexOf('<')) : ''
      return `${info.fullPackage}.${base}${suffix}`
    }
    return typeName
  }

  private isExternal(typeName: string): boolean {
    const base = typeName.split(/[<>[\]]/)[0]
    return this.fqnMap[base]?.isExternal || false
  }

  private cleanTypeForDSL(t: string): string {
    if (!t) return 'void'
    let cleaned = t.trim().split('=')[0].trim()

    if (cleaned.startsWith('{') || cleaned.includes('{')) return 'Object'
    if (cleaned.includes('|')) cleaned = cleaned.split('|')[0].trim()

    cleaned = cleaned.replace(/\s+/g, '')

    let depth = 0
    let balanced = ''
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i]
      if (char === '<') depth++
      if (char === '>') {
        if (depth > 0) depth--
        else continue
      }
      balanced += char
    }
    while (depth > 0) {
      balanced += '>'
      depth--
    }

    return balanced.replace(/[,;{]$/, '')
  }

  private mapVisibility(v: string): string {
    switch (v) {
      case 'private':
        return '-'
      case 'protected':
        return '#'
      case 'public':
        return '+'
      default:
        return '+'
    }
  }

  private generateUMLTS(): string {
    let output = ''
    for (const [pkgName, entities] of this.packages.entries()) {
      output += `package ${pkgName} {\n`
      entities.forEach((e) => {
        output += `  ${e.kind} ${e.name} {\n`
        e.members.forEach((m) => {
          output += `    ${m}\n`
        })
        output += `  }\n\n`
        e.relations.forEach((r) => {
          output += `  ${e.name} ${r.type} ${r.target}${r.label ? ` : "${r.label}"` : ''}\n`
        })
      })
      output += `}\n\n`
    }
    return output
  }
}
