import { UMLComponent } from './component.abstract'
import { type Point } from './types'

/**
 * 2. PATH NODES (Connectors)
 * Elements routed by ELK using waypoints.
 */
export abstract class UMLPathNode extends UMLComponent {
  public waypoints: Point[] = []
  public strokeStyle = 'solid'
}
