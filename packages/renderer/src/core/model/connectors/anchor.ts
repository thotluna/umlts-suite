import { UMLPathNode } from '../base/path-node.abstract'
import { type Point } from '../base/types'

/**
 * Anchor: Visual line connecting a note to an element.
 */
export class UMLAnchor extends UMLPathNode {
  constructor(
    id: string,
    public readonly fromId: string,
    public readonly toIds: string[],
  ) {
    super(id)
  }

  /**
   * Updates anchor waypoints after layout.
   */
  public updateLayout(_targetId: string, waypoints: Point[]): void {
    this.waypoints = waypoints
  }
}
