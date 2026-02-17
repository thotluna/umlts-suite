import type {
  IRDiagram as IR,
  IREntity,
  IRRelationship,
  IRRelationshipType,
  IRMember,
  IRParameter,
  IRVisibility as EngineVisibility,
  IRConstraint,
} from '@umlts/engine'

export type IRVisibility = EngineVisibility | '+' | '-' | '#' | '~'

/**
 * Mapeo de tipos de relación para compatibilidad con el renderer.
 * El renderer espera strings, el motor provee un enum.
 */
export type IRRelType =
  | IRRelationshipType
  | 'Association'
  | 'Inheritance'
  | 'Implementation'
  | 'Composition'
  | 'Aggregation'
  | 'Dependency'
  | 'ASSOCIATION'
  | 'INHERITANCE'
  | 'IMPLEMENTATION'
  | 'COMPOSITION'
  | 'AGGREGATION'
  | 'DEPENDENCY'
  | 'Bidirectional'
  | 'BIDIRECTIONAL'

export type { IR, IREntity, IRRelationship, IRMember, IRParameter, IRConstraint }
