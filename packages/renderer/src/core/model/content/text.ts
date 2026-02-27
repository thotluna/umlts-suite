import { UMLContentNode } from '../base/content-node.abstract'
import { type Size, type DrawingContext } from '../base/types'
import { measureText } from '../../../layout/measure'

/**
 * Fundamental atomic text element.
 * Handles measurement and styles.
 */
export class UMLText extends UMLContentNode {
  public isItalic = false
  public isUnderline = false

  constructor(
    id: string,
    public text: string,
    public fontSize = 12,
    public fontWeight = 'normal',
  ) {
    super(id)
  }

  /**
   * Calculates dimensions based on text content and scale.
   */
  public override getDimensions(): Size {
    const dim = measureText(this.text, this.fontSize)
    return {
      width: dim.width,
      height: dim.height,
    }
  }

  public override draw(_ctx: DrawingContext): string {
    return `<text 
      x="${this.relX}" 
      y="${this.relY}" 
      font-size="${this.fontSize}" 
      font-weight="${this.fontWeight}"
      ${this.isItalic ? 'font-style="italic"' : ''}
      ${this.isUnderline ? 'text-decoration="underline"' : ''}
    >${this.text}</text>`
  }
}
