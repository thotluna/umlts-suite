/**
 * Intermediate Representation (IR) from ts-uml-engine.
 * This is the raw data we receive from the compiler.
 */

export type IRVisibility = '+' | '-' | '#' | '~'

export interface IRParameter {
  name: string
  type?: string
  relationshipKind?: string
}

export interface IRMember {
  name: string
  type?: string
  visibility: IRVisibility
  isStatic: boolean
  isAbstract: boolean
  relationshipKind?: string
  multiplicity?: string
  parameters?: IRParameter[]
  docs?: string
  line?: number
  column?: number
}

export type IRRelType =
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

export interface IRRelationship {
  from: string
  to: string
  type: IRRelType
  label?: string
  visibility?: IRVisibility
  fromMultiplicity?: string
  toMultiplicity?: string
  line?: number
  column?: number
}

export interface IREntity {
  id: string
  name: string
  type: 'Class' | 'Interface' | 'Enum'
  members: IRMember[]
  isImplicit: boolean
  isAbstract: boolean
  isStatic: boolean
  isActive: boolean
  namespace?: string
  typeParameters?: string[]
  docs?: string
  line?: number
  column?: number
}

export interface IR {
  entities: IREntity[]
  relationships: IRRelationship[]
  config?: Record<string, unknown>
}
