import { type IRMember, type IRRelType, type IRConstraint } from '../contract/ir'
import { measureNodeDimensions } from '../../layout/measure'

/**
 * Port side definition for ELK.
 */
export type PortSide = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST'

/**
 * Connection point for edges on a node.
 */
export interface UMLPort {
  id: string
  side: PortSide
  x: number
  y: number
}

/**
 * Base abstract class for any item that can participate in the diagram hierarchy.
 * This provides a language-agnostic way to handle nodes and packages.
 */
export abstract class UMLHierarchyItem {
  public x = 0
  public y = 0
  public width = 0
  public height = 0
  public ports: UMLPort[] = []

  constructor(
    public readonly id: string,
    public readonly name: string,
  ) {}

  public updateLayout(x: number, y: number, width: number, height: number): void {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  public updatePorts(ports: UMLPort[]): void {
    this.ports = ports
  }
}

/**
 * Rich Domain Model for UML Entities.
 */
export class UMLNode extends UMLHierarchyItem {
  constructor(
    id: string,
    name: string,
    public readonly type: 'Class' | 'Interface' | 'Enum',
    public readonly attributes: IRMember[],
    public readonly methods: IRMember[],
    public readonly isImplicit: boolean,
    public readonly isAbstract: boolean,
    public readonly isStatic: boolean,
    public readonly isActive: boolean,
    public readonly isLeaf: boolean,
    public readonly isFinal: boolean,
    public readonly isRoot: boolean,
    public readonly typeParameters: string[],
    public readonly namespace?: string,
    public readonly docs?: string,
  ) {
    super(id, name)
  }

  /**
   * Calculates the dimensions of this node based on its content.
   */
  public getDimensions(): { width: number; height: number } {
    return measureNodeDimensions(this)
  }
}

/**
 * Rich Domain Model for UML Relationships.
 */
export class UMLEdge {
  public waypoints?: Array<{ x: number; y: number }>
  public labelPos?: { x: number; y: number }
  public labelWidth?: number
  public labelHeight?: number

  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly type: IRRelType,
    public readonly label?: string,
    public readonly visibility?: string,
    public readonly fromMultiplicity?: string,
    public readonly toMultiplicity?: string,
    public readonly associationClassId?: string,
    public readonly constraints?: IRConstraint[],
  ) {}

  public updateLayout(
    waypoints: Array<{ x: number; y: number }>,
    labelPos?: { x: number; y: number },
    labelWidth?: number,
    labelHeight?: number,
  ): void {
    this.waypoints = waypoints
    this.labelPos = labelPos
    this.labelWidth = labelWidth
    this.labelHeight = labelHeight
  }
}

/**
 * Rich Domain Model for Packages.
 */
export class UMLPackage extends UMLHierarchyItem {
  constructor(
    name: string,
    public readonly children: UMLHierarchyItem[],
    public readonly path?: string,
  ) {
    super(path || name, name)
  }
}

export interface DiagramModel {
  nodes: UMLNode[]
  edges: UMLEdge[]
  packages: UMLPackage[]
  constraints: IRConstraint[]
}
