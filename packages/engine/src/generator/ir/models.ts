/**
 * Tipos de entidades soportadas en la IR.
 */
export enum IREntityType {
  CLASS = 'Class',
  INTERFACE = 'Interface',
  ENUM = 'Enum'
}

/**
 * Visibilidad de miembros.
 */
export enum IRVisibility {
  PUBLIC = '+',
  PRIVATE = '-',
  PROTECTED = '#',
  INTERNAL = '~'
}

/**
 * Representa un miembro (Atributo o Método) en la IR.
 */
export interface IRMember {
  name: string;
  type?: string;
  visibility: IRVisibility;
  isStatic: boolean;
  isAbstract: boolean;
  parameters?: Array<{ name: string; type: string; relationshipKind?: string }>;
  relationshipKind?: string;
  multiplicity?: string;
  line?: number;
  column?: number;
  docs?: string | undefined;
}

/**
 * Representa una entidad de UML (Clase, Interfaz, Enum) resuelta.
 */
export interface IREntity {
  id: string; // FQN
  name: string;
  type: IREntityType;
  members: IRMember[];
  isImplicit: boolean;
  isAbstract: boolean;
  isActive: boolean;
  typeParameters?: string[] | undefined;
  namespace?: string;
  docs?: string | undefined;
  line?: number;
  column?: number;
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
  DEPENDENCY = 'Dependency'
}

/**
 * Representa una conexión entre dos entidades en la IR.
 */
export interface IRRelationship {
  from: string;
  to: string;
  type: IRRelationshipType;
  fromMultiplicity?: string | undefined;
  toMultiplicity?: string | undefined;
  label?: string;
  docs?: string | undefined;
  line?: number;
  column?: number;
}

/**
 * Representación Intermedia Final del Diagrama.
 */
export interface IRDiagram {
  entities: IREntity[];
  relationships: IRRelationship[];
}
