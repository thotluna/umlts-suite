import { UMLComponent } from './component.abstract'
import { type Size } from './types'

/**
 * 3. CONTENT NODES (Atoms)
 * Elements living inside SpatialNodes with relative coordinates.
 */
export abstract class UMLContentNode extends UMLComponent {
  public relX = 0
  public relY = 0

  public abstract getDimensions(): Size
}
