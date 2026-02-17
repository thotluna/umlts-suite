import { RelationshipKind, SemanticRelationship } from '../core/parser/semantics/types'

export interface UMLTMember {
  name: string
  type: string
  visibility: string // +, -, #, ~
  isStatic: boolean // $
  isAbstract: boolean // *
  isOptional?: boolean // ?
  relSymbol?: string // >-, >+, >*, ><
  multiplicity?: string
  stereotype?: string // <<nullable>>, etc.
}

export interface UMLTSEntity {
  kind: 'CLASS' | 'INTERFACE' | 'TYPE'
  name: string
  packageName: string
  members: UMLTMember[]
  modifiers: string[]
  extends?: string
  implements?: string[]
}

export class UMLTSGenerator {
  private entities: Map<string, UMLTSEntity> = new Map()
  private externalRelationships: SemanticRelationship[] = []
  private relSeen: Set<string> = new Set()

  public addEntity(entity: UMLTSEntity) {
    this.entities.set(`${entity.packageName}.${entity.name}`, entity)
  }

  public addExternalRelationship(rel: SemanticRelationship) {
    const key = `${rel.source}-${rel.target}-${rel.kind}-${rel.stereotype || ''}`
    if (this.relSeen.has(key)) return

    this.externalRelationships.push(rel)
    this.relSeen.add(key)
  }

  public generate(): string {
    const packages = new Map<string, UMLTSEntity[]>()
    const allPackageNames = new Set<string>()

    this.entities.forEach((entity) => {
      const list = packages.get(entity.packageName) || []
      list.push(entity)
      packages.set(entity.packageName, list)
      allPackageNames.add(entity.packageName)
    })

    const commonPrefix = this.getCommonPrefix(Array.from(allPackageNames))
    const trimPkg = (name: string) => {
      if (!commonPrefix) return name
      if (name === commonPrefix) return 'root'
      return name.replace(new RegExp(`^${commonPrefix}\\.`), '')
    }

    let output = ''

    packages.forEach((entities, fullPkgName) => {
      const displayPkgName = trimPkg(fullPkgName)
      output += `package ${displayPkgName} {\n`

      entities.forEach((entity) => {
        const kind = entity.kind.toLowerCase()
        const mods = entity.modifiers.length ? entity.modifiers.join(' ') + ' ' : ''

        const isTypeAlias = kind === 'type'
        if (isTypeAlias && entity.members.length === 0) {
          // Omitimos completamente la declaración del type si está vacío
        } else {
          let header = `  ${mods}${kind} ${entity.name}`
          if (entity.extends) header += ` >> ${this.trimFqn(entity.extends, commonPrefix)}`
          if (entity.implements?.length) {
            header += ` >I ${entity.implements.map((i) => this.trimFqn(i, commonPrefix)).join(', ')}`
          }

          output += `${header} {\n`

          // Renderizado de Miembros In-line
          entity.members.forEach((m) => {
            const prefix = `${m.visibility}${m.isAbstract ? '*' : ''}${m.isStatic ? '$' : ''}`
            const stereo = m.stereotype ? ` <<${m.stereotype}>>` : ''
            const rel = m.relSymbol ? `${m.relSymbol} ` : ''
            const target = this.trimFqn(this.sanitizeType(m.type), commonPrefix)
            const mult = m.multiplicity && m.multiplicity !== '1' ? ` [${m.multiplicity}]` : ''

            output += `    ${prefix}${m.name}${stereo}: ${rel}${target}${mult}\n`
          })

          output += `  }\n\n`
        }
      })

      // RENDERIZADO DE RELACIONES EXTERNAS DEL PAQUETE
      const pkgRels = this.externalRelationships.filter((rel) => {
        const sourceEntity = this.entities.get(rel.source)
        return sourceEntity?.packageName === fullPkgName
      })

      const xorGroups = new Map<string, SemanticRelationship[]>()
      const standaloneRels: SemanticRelationship[] = []

      pkgRels.forEach((rel) => {
        if (rel.xorGroup) {
          const group = xorGroups.get(rel.xorGroup) || []
          group.push(rel)
          xorGroups.set(rel.xorGroup, group)
        } else {
          standaloneRels.push(rel)
        }
      })

      // Imprimir Standalone
      standaloneRels.forEach((rel) => {
        const sourceName = rel.source.split('.').pop()
        const target = this.trimFqn(rel.target, commonPrefix)
        const symbol = this.getRelationshipSymbol(rel.kind)
        const mult = rel.multiplicity && rel.multiplicity !== '1' ? ` [${rel.multiplicity}]` : ''
        const label = rel.label || rel.stereotype || ''
        const stereo = label ? ` : "<<${label}>>"` : ''
        output += `  ${sourceName} ${symbol} ${target}${mult}${stereo}\n`
      })

      // Imprimir Bloques XOR
      xorGroups.forEach((rels) => {
        output += `  xor {\n`
        rels.forEach((rel) => {
          const sourceName = rel.source.split('.').pop()
          const target = this.trimFqn(rel.target, commonPrefix)
          const symbol = this.getRelationshipSymbol(rel.kind)
          // Usamos etiquetas simples para roles en XOR
          const roleLabel = rel.label ? ` : "${rel.label}"` : ''
          output += `    ${sourceName} ${symbol} ${target}${roleLabel}\n`
        })
        output += `  }\n`
      })

      output += `}\n\n`
    })

    return output
  }

  private sanitizeType(type: string | undefined): string {
    if (!type) return 'any'
    // Preservar la cadena completa si contiene uniones o intersecciones para el label
    // Pero lo protegemos de caracteres no válidos en el motor si es necesario
    return type.replace(/[^a-zA-Z0-9_.<>[\]*|&_ ,]/g, '')
  }

  private trimFqn(fqn: string, prefix: string): string {
    if (!prefix) return fqn
    return fqn.replace(new RegExp(`^${prefix}\\.`), '')
  }

  private getCommonPrefix(paths: string[]): string {
    if (paths.length <= 1) return ''
    const sorted = paths.sort()
    const first = sorted[0].split('.')
    const last = sorted[sorted.length - 1].split('.')
    let i = 0
    while (i < first.length && first[i] === last[i]) i++
    return first.slice(0, i).join('.')
  }

  private getRelationshipSymbol(kind: RelationshipKind): string {
    switch (kind) {
      case RelationshipKind.COMPOSITION:
        return '>*'
      case RelationshipKind.AGGREGATION:
        return '>+'
      case RelationshipKind.ASSOCIATION:
        return '><'
      case RelationshipKind.DEPENDENCY:
        return '>-'
      case RelationshipKind.REFINEMENT:
        return '>-'
      case RelationshipKind.INHERITANCE:
        return '>>'
      case RelationshipKind.REALIZATION:
        return '>I'
      default:
        return '>-'
    }
  }
}
