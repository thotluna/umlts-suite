import { UMLPathNode } from '../base/path-node.abstract'
import { type Point } from '../base/types'
import { type IRMultiplicity } from '@umlts/engine'
import { type UMLConstraintArc } from './constraint-arc'

/**
 * UMLEdge: Semantic connection between entities.
 */
export abstract class UMLEdge extends UMLPathNode {
  public fromMultiplicity?: string | IRMultiplicity
  public toMultiplicity?: string | IRMultiplicity
  public label?: string
  public visibility?: string
  public constraints: UMLConstraintArc[] = []
  public associationClassId?: string

  // Layout metadata
  public labelPos?: Point
  public labelWidth?: number
  public labelHeight?: number

  constructor(
    id: string,
    public readonly from: string,
    public readonly to: string,
  ) {
    super(id)
  }

  public abstract get type(): string

  /**
   * Updates edge waypoints and label position after layout.
   */
  public updateLayout(
    waypoints: Point[],
    labelPos?: Point,
    labelWidth?: number,
    labelHeight?: number,
  ): void {
    this.waypoints = waypoints
    if (labelPos) this.labelPos = labelPos
    if (labelWidth) this.labelWidth = labelWidth
    if (labelHeight) this.labelHeight = labelHeight
  }
}
