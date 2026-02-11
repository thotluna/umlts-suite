
/**
 * Intermediate Representation (IR) from ts-uml-engine.
 * This is the raw data we receive from the compiler.
 */

/**
 * Possible visibility levels for class members in UML.
 */
export type IRVisibility = '+' | '-' | '#' | '~';

/**
 * Metadata for a method parameter.
 */
export interface IRParameter {
  name: string;
  type?: string;
  relationshipKind?: string;
}

/**
 * Represents an attribute or a method within a UML entity.
 */
export interface IRMember {
  name: string;
  type?: string;
  visibility: IRVisibility;
  isStatic: boolean;
  isAbstract: boolean;
  relationshipKind?: string;
  /** Presence of brackets '[]' or specific strings. */
  multiplicity?: string;
  /** List of parameters. If present, the member is treated as a Method. */
  parameters?: IRParameter[];
  /** JSDoc or developer comments. */
  docs?: string;
  line?: number;
  column?: number;
}

/**
 * Basic UML relationship types supported by the renderer.
 */
export type IRRelType =
  | 'Inheritance'
  | 'Implementation'
  | 'Composition'
  | 'Aggregation'
  | 'Dependency'
  | 'Association';

/**
 * Defines a relationship/edge between two entities.
 */
export interface IRRelationship {
  from: string;
  to: string;
  type: IRRelType;
  label?: string;
  visibility?: IRVisibility;
  fromMultiplicity?: string;
  toMultiplicity?: string;
  line?: number;
  column?: number;
}

/**
 * Represents a top-level UML element (Class, Interface, or Enum).
 */
export interface IREntity {
  id: string;
  name: string;
  type: 'Class' | 'Interface' | 'Enum';
  members: IRMember[];
  /** True if the entity was generated automatically (e.g. for unknown types). */
  isImplicit: boolean;
  isAbstract: boolean;
  /** True if the class has a thread of execution (active class). */
  isActive: boolean;
  /** Dot-separated namespace or package path. */
  namespace?: string;
  /** List of generic types/parameters. */
  typeParameters?: string[];
  docs?: string;
  line?: number;
  column?: number;
}

/**
 * Intermediate Representation (IR) Schema.
 * This is the standard data contract received from the engine.
 */
export interface IR {
  entities: IREntity[];
  relationships: IRRelationship[];
}

/**
 * Internal Model for the Renderer.
 * Normalized and ready for Layout and SVG generation.
 */

export interface DiagramNode {
  id: string;
  name: string;
  type: 'Class' | 'Interface' | 'Enum';
  attributes: IRMember[];
  methods: IRMember[];
  isImplicit: boolean;
  isAbstract: boolean;
  isActive: boolean;
  namespace?: string;
  typeParameters: string[];
  docs?: string;
  width?: number;  // Setted by LayoutEngine
  height?: number; // Setted by LayoutEngine
  x?: number;      // Setted by LayoutEngine
  y?: number;      // Setted by LayoutEngine
}

export interface DiagramEdge {
  from: string;
  to: string;
  type: IRRelType;
  label?: string;
  visibility?: string;
  fromMultiplicity?: string;
  toMultiplicity?: string;
  waypoints?: { x: number; y: number }[]; // Calculated by ELK
  labelPos?: { x: number; y: number };    // Calculated by ELK
  labelWidth?: number;
  labelHeight?: number;
}

export interface DiagramPackage {
  id?: string;
  name: string;
  children: (DiagramNode | DiagramPackage)[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface DiagramModel {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  packages: DiagramPackage[];
}

export interface LayoutResult {
  model: DiagramModel;
  totalWidth: number;
  totalHeight: number;
}
