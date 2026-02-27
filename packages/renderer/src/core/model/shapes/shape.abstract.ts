import { UMLSpatialNode } from '../base/spatial-node.abstract'
import { type UMLTemplateBox } from '../content/template-box'

/**
 * 3.2 Figures (Shapes)
 */
export abstract class UMLShape extends UMLSpatialNode {
  public templateBox?: UMLTemplateBox

  public override get name(): string {
    return this.id
  }
}
