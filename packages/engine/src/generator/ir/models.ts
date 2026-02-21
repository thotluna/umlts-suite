/**
 * Interoperabilidad y Estándar UML 2.5.1
 * Representación Intermedia (IR) para el motor UMLTS.
 * Este archivo es la ÚNICA fuente de verdad para el contrato entre el motor y los renderers.
 */

/**
 * Categoría: Detalles - Modificadores
 */
export interface IRModifiers {
  isAbstract: boolean
  isStatic: boolean
  isActive: boolean
  isLeaf: boolean
  isFinal: boolean
  isRoot: boolean
}

/**
 * Categoría: Clasificadores (Cláusulas 10 y 11)
 */
export enum IREntityType {
  CLASS = 'Class', // Cláusula 11.4
  INTERFACE = 'Interface', // Cláusula 10.4
  DATA_TYPE = 'DataType', // Cláusula 10.2
  ENUMERATION = 'Enumeration', // Cláusula 10.2
  PRIMITIVE_TYPE = 'PrimitiveType', // Cláusula 10.5.7
  ASSOCIATION_CLASS = 'AssociationClass', // Cláusula 11.8.2
}

/**
 * Categoría: Detalles - Visibilidad (Cláusula 7.8.24)
 */
export enum IRVisibility {
  PUBLIC = '+',
  PRIVATE = '-',
  PROTECTED = '#',
  PACKAGE = '~',
}

/**
 * Categoría: Detalles - Multiplicidad (Cláusula 7.5)
 */
export interface IRMultiplicity {
  lower: number
  upper: number | '*'
}

/**
 * Categoría: Características - Parámetro (Cláusula 9.4)
 */
export interface IRParameter {
  name: string
  type?: string
  multiplicity?: IRMultiplicity
  direction?: 'in' | 'out' | 'inout' | 'return'
  relationshipKind?: string
  modifiers?: IRModifiers
  line?: number
  column?: number
}

/**
 * Categoría: Características - Propiedad (Cláusula 9.5)
 */
export interface IRProperty {
  name: string
  type?: string
  visibility: IRVisibility
  isStatic: boolean
  isReadOnly: boolean
  isLeaf: boolean
  multiplicity?: IRMultiplicity
  isOrdered: boolean
  isUnique: boolean
  aggregation: 'none' | 'shared' | 'composite' // Cláusula 11.5.3.2
  label?: string

  // Metadata de soporte
  line?: number
  column?: number
  docs?: string
  constraints?: IRConstraint[]
}

/**
 * Categoría: Características - Operación (Cláusula 9.6)
 */
export interface IROperation {
  name: string
  visibility: IRVisibility
  isStatic: boolean
  isAbstract: boolean
  isLeaf: boolean
  isQuery: boolean
  parameters: IRParameter[]
  returnType?: string
  returnMultiplicity?: IRMultiplicity

  // Metadata de soporte
  line?: number
  column?: number
  docs?: string
  constraints?: IRConstraint[]
}

/**
 * Categoría: Características - Literal de Enumeración (Cláusula 10.5.4)
 */
export interface IREnumerationLiteral {
  name: string
  docs?: string
}

/**
 * Representa un Clasificador UML resuelto.
 */
export interface IREntity {
  id: string // FQN (Fully Qualified Name)
  name: string
  type: IREntityType

  // Miembros estructurados según Metaclases UML
  properties: IRProperty[]
  operations: IROperation[]
  literals?: IREnumerationLiteral[]

  isImplicit: boolean // Estado interno del motor
  isAbstract: boolean
  isActive: boolean
  isLeaf: boolean
  isFinal: boolean
  isRoot: boolean
  isStatic: boolean

  typeParameters?: string[]
  namespace?: string
  docs?: string

  line?: number
  column?: number
}

/**
 * Categoría: Relaciones (Cláusulas 7, 9, 10, 11)
 */
export enum IRRelationshipType {
  ASSOCIATION = 'Association', // 11.5
  GENERALIZATION = 'Generalization', // 9.2 (Herencia)
  INTERFACE_REALIZATION = 'InterfaceRealization', // 10.4 (Implementación)
  DEPENDENCY = 'Dependency', // 7.7
  SUBSTITUTION = 'Substitution', // 9.9.22
  USAGE = 'Usage', // 7.8.23
  TEMPLATE_BINDING = 'TemplateBinding', // 7.3

  // Alias de compatibilidad (Deprecados con valores únicos)
  INHERITANCE = 'Inheritance',
  IMPLEMENTATION = 'Implementation',
  COMPOSITION = 'Composition',
  AGGREGATION = 'Aggregation',
  BIDIRECTIONAL = 'Bidirectional',
  REALIZATION = 'Realization',
}

/**
 * Representa una conexión entre elementos UML.
 */
export interface IRRelationship {
  from: string
  to: string
  type: IRRelationshipType

  // Multiplicidades en los extremos (Association Ends)
  fromMultiplicity?: IRMultiplicity
  toMultiplicity?: IRMultiplicity

  // Roles de asociación
  fromName?: string
  toName?: string

  isNavigable: boolean
  label?: string
  visibility?: IRVisibility
  associationClassId?: string

  line?: number
  column?: number
  docs?: string
  constraints?: IRConstraint[]
}

/**
 * Categoría: Detalles - Restricción (Cláusula 7.6)
 */
export interface IRConstraint {
  kind: string
  targets: string[]
  expression?: string
}

/**
 * Representación Intermedia FINAL para el Renderer.
 */
export interface IRDiagram {
  entities: IREntity[]
  relationships: IRRelationship[]
  constraints: IRConstraint[]
  config?: Record<string, unknown>
}
