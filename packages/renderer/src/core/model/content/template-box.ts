import { UMLContentNode } from '../base/content-node.abstract'
import { type Size, type DrawingContext } from '../base/types'
import { type UMLText } from './text'

/**
 * 3.1 Template Parameters Box (Generics)
 */
export class UMLTemplateBox extends UMLContentNode {
  public parameters: UMLText[] = []

  public override getDimensions(): Size {
    if (this.parameters.length === 0) return { width: 0, height: 0 }
    // Estimate: 8px per char + padding
    const maxLen = Math.max(...this.parameters.map((p) => p.text.length))
    return {
      width: maxLen * 8 + 10,
      height: this.parameters.length * 15 + 10,
    }
  }

  public override draw(_ctx: DrawingContext): string {
    return ''
  }
}
