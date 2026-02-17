import { Token } from '../lexer/types'

export interface TypeNode {
  kind:
    | 'simple'
    | 'generic'
    | 'union'
    | 'intersection'
    | 'array'
    | 'literal'
    | 'function'
    | 'object'
  name: string // El identificador base (ej: 'Omit', 'User', 'Map')
  fullLabel: string // La representación visual completa
  arguments?: TypeNode[] // Para genéricos <T, K>
  types?: TypeNode[] // Para uniones A | B
  members?: Array<{ name: string; type: TypeNode }> // Para objetos { x: number }
  literalValue?: string // Para tipos constantes: 'active', 42, true
  isCollection: boolean // Flag para multiplicidad [0..*]
}

export interface TypeAnalysis {
  root: TypeNode
  references: string[] // FQNs para el mapa de dependencias
}

/**
 * Interfaz para procesadores específicos de tipos (Estrategia).
 */
export interface TypeProcessor {
  match(tokens: Token[], startIndex: number): boolean
  process(
    tokens: Token[],
    startIndex: number,
    resolutionMap: Map<string, string>,
  ): {
    analysis: TypeAnalysis
    consumedCount: number
  }
}
