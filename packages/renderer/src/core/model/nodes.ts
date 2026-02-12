
import { IRMember, IRRelType } from '../contract/ir';
import { measureNodeDimensions } from '../../layout/measure';

/**
 * Base abstract class for any item that can participate in the diagram hierarchy.
 * This provides a language-agnostic way to handle nodes and packages.
 */
export abstract class UMLHierarchyItem {
  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
  public height: number = 0;

  constructor(
    public readonly id: string,
    public readonly name: string
  ) { }

  public updateLayout(x: number, y: number, width: number, height: number): void {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
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
    public readonly typeParameters: string[],
    public readonly namespace?: string,
    public readonly docs?: string
  ) {
    super(id, name);
  }

  /**
   * Calculates the dimensions of this node based on its content.
   */
  public getDimensions(): { width: number; height: number } {
    return measureNodeDimensions(this);
  }
}

/**
 * Rich Domain Model for UML Relationships.
 */
export class UMLEdge {
  public waypoints?: { x: number; y: number }[];
  public labelPos?: { x: number; y: number };
  public labelWidth?: number;
  public labelHeight?: number;

  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly type: IRRelType,
    public readonly label?: string,
    public readonly visibility?: string,
    public readonly fromMultiplicity?: string,
    public readonly toMultiplicity?: string
  ) { }

  public updateLayout(
    waypoints: { x: number; y: number }[],
    labelPos?: { x: number; y: number },
    labelWidth?: number,
    labelHeight?: number
  ): void {
    this.waypoints = waypoints;
    this.labelPos = labelPos;
    this.labelWidth = labelWidth;
    this.labelHeight = labelHeight;
  }
}

/**
 * Rich Domain Model for Packages.
 */
export class UMLPackage extends UMLHierarchyItem {
  constructor(
    name: string,
    public readonly children: UMLHierarchyItem[],
    public readonly path?: string
  ) {
    super(path || name, name);
  }
}

export interface DiagramModel {
  nodes: UMLNode[];
  edges: UMLEdge[];
  packages: UMLPackage[];
}
