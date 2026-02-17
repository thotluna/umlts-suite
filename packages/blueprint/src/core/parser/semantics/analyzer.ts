import { TypeNode } from '../types'
import { RelationshipKind, SemanticRelationship } from './types'

/**
 * Analiza un TypeNode y determina qué tipo de relación UML representa
 * basándose en el contexto (Atributo vs Parámetro).
 */
const IGNORED_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'any',
  'unknown',
  'never',
  'void',
  'null',
  'undefined',
  'symbol',
  'bigint',
  'object',
  'Record',
  'Map',
  'Set',
  'Promise',
  'Error',
  'any',
  'T',
  'U',
  'K',
  'V', // También ignoraremos parámetros genéricos comunes
])

export class SemanticAnalyzer {
  public analyze(
    source: string,
    node: TypeNode,
    context: 'field' | 'param' | 'return' | 'alias',
    memberName?: string,
  ): SemanticRelationship[] {
    const relationships: SemanticRelationship[] = []

    // FILTRO DE PRIMITIVOS: Si es un tipo básico, no genera relación
    if (node.name && IGNORED_TYPES.has(node.name)) {
      return []
    }

    // CASO 1: LITERALES DE OBJETO -> COMPOSITION (La entidad lo define y posee)
    if (node.kind === 'object') {
      relationships.push({
        source,
        target: 'InternalStructure',
        kind: RelationshipKind.COMPOSITION,
        multiplicity: '1',
        stereotype: '<<inline>>',
      })
      // Analizamos también los miembros internos del objeto literal
      node.members?.forEach((m) => {
        relationships.push(...this.analyze(source, m.type, context))
      })
      return relationships
    }

    // CASO 2: UNIONES (Polimorfismo / XOR)
    if (node.kind === 'union' && node.types) {
      const allSubRels: SemanticRelationship[] = []
      node.types.forEach((t) => {
        allSubRels.push(...this.analyze(source, t, context, memberName))
      })

      // Detectar nulabilidad para propagar a las relaciones (ej: T | U | null)
      const isNullable = node.types.some((t) => t.name === 'null' || t.name === 'undefined')
      const targetMult = isNullable ? '0..1' : '1'

      // Solo creamos grupo XOR si hay MÁS de una relación efectiva
      if (allSubRels.length > 1) {
        const groudId = `xor_${Math.random().toString(36).substr(2, 5)}`
        return allSubRels.map((r) => ({
          ...r,
          xorGroup: groudId,
          multiplicity: targetMult,
          // Si hay un nombre de miembro, hacemos el rol único para no violar el estándar
          label: memberName ? `${memberName}_${r.target.split('.').pop()}` : undefined,
        }))
      }

      // Si solo hay una relación (ej: User | null), la devolvemos tal cual (sin XOR)
      return allSubRels.map((r) => ({ ...r, multiplicity: targetMult }))
    }

    // CASO 3: UTILITY TYPES (Omit, Pick, Partial) -> REFINEMENT
    const utilities = ['Omit', 'Pick', 'Partial']
    if (node.kind === 'generic' && utilities.includes(node.name) && node.arguments) {
      // Resolución recursiva para encontrar la entidad base (ej: Partial<Omit<User>>)
      const subRels = this.analyze(source, node.arguments[0], context, memberName)

      if (subRels.length > 0) {
        // Heredamos el target de la relación interna pero aplicamos nuestro refinamiento
        return subRels.map((r) => ({
          ...r,
          kind: RelationshipKind.REFINEMENT,
          stereotype: node.name.toLowerCase(),
        }))
      }

      const baseEntity = node.arguments[0].name
      relationships.push({
        source,
        target: baseEntity,
        kind: RelationshipKind.REFINEMENT,
        stereotype: node.name.toLowerCase(),
        multiplicity: '1',
      })
      return relationships
    }

    // CASO 4: COLECCIONES -> AGGREGATION (Son un grupo de elementos 'dados')
    if (node.isCollection) {
      relationships.push({
        source,
        target: node.name,
        kind: context === 'field' ? RelationshipKind.AGGREGATION : RelationshipKind.DEPENDENCY,
        multiplicity: '0..*',
      })
      return relationships
    }

    // CASO 5: ASOCIACIÓN SIMPLE (Campos de clase)
    if (context === 'field' && node.kind === 'simple' && node.name !== 'any') {
      relationships.push({
        source,
        target: node.name,
        kind: RelationshipKind.ASSOCIATION,
        multiplicity: '1',
      })
    }

    // CASO 5: DEPENDENCIA (Métodos)
    if (
      (context === 'param' || context === 'return') &&
      node.kind === 'simple' &&
      node.name !== 'any'
    ) {
      relationships.push({
        source,
        target: node.name,
        kind: RelationshipKind.DEPENDENCY,
        multiplicity: '1',
      })
    }

    return relationships
  }
}
