/**
 * Tipos de entidades soportadas en la IR.
 */
export enum IREntityType {
  CLASS = 'Class',
  INTERFACE = 'Interface',
  ENUM = 'Enum',
}

/**
 * Visibilidad de miembros.
 */
export enum IRVisibility {
  PUBLIC = '+',
  PRIVATE = '-',
  PROTECTED = '#',
  INTERNAL = '~',
}

export interface IRTargetModifiers {
  isAbstract?: boolean
  isStatic?: boolean
  isActive?: boolean
  isLeaf?: boolean
  isFinal?: boolean
  isRoot?: boolean
}

/**
 * Representa un parámetro de un método en la IR.
 */
export interface IRParameter {
  name: string
  type?: string
  relationshipKind?: string
  targetModifiers?: IRTargetModifiers
}

/**
 * Representa un miembro (Atributo o Método) en la IR.
 */
export interface IRMember {
  name: string
  type?: string
  visibility: IRVisibility
  isStatic: boolean
  isAbstract: boolean
  isLeaf: boolean
  isFinal: boolean
  parameters?: IRParameter[]
  relationshipKind?: string
  targetModifiers?: IRTargetModifiers
  multiplicity?: string
  line?: number
  column?: number
  docs?: string | undefined
}

/**
 * Representa una entidad de UML (Clase, Interfaz, Enum) resuelta.
 */
export interface IREntity {
  id: string // FQN
  name: string
  type: IREntityType
  members: IRMember[]
  isImplicit: boolean
  isAbstract: boolean
  isStatic: boolean
  isActive: boolean
  isLeaf: boolean
  isFinal: boolean
  isRoot: boolean
  typeParameters?: string[] | undefined
  namespace?: string
  docs?: string | undefined
  line?: number
  column?: number
}

/**
 * Tipos de relaciones UML resueltas.
 */
export enum IRRelationshipType {
  ASSOCIATION = 'Association',
  INHERITANCE = 'Inheritance',
  IMPLEMENTATION = 'Implementation',
  COMPOSITION = 'Composition',
  AGGREGATION = 'Aggregation',
  DEPENDENCY = 'Dependency',
  REALIZATION = 'Realization',
  BIDIRECTIONAL = 'Bidirectional',
}

/**
 * Representa una conexión entre dos entidades en la IR.
 */
export interface IRRelationship {
  from: string
  to: string
  type: IRRelationshipType
  fromMultiplicity?: string | undefined
  toMultiplicity?: string | undefined
  label?: string
  visibility?: IRVisibility
  associationClassId?: string // Link to the IREntity that represents the class aspect
  docs?: string | undefined
  line?: number
  column?: number
}

/**
 * Representación Intermedia Final del Diagrama.
 */
export interface IRDiagram {
  entities: IREntity[]
  relationships: IRRelationship[]
  config?: Record<string, unknown>
}
