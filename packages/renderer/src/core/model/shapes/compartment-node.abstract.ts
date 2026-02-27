import { UMLHeaderShape } from './header-shape.abstract'
import { type UMLMember } from '../content/member'
import { type Size } from '../base/types'

import { MEASURE_CONFIG } from '../base/measure-constants'

/**
 * Shapes with compartments (Classes, Interfaces)
 */
export abstract class UMLCompartmentNode extends UMLHeaderShape {
  public properties: UMLMember[] = []
  public operations: UMLMember[] = []

  public addProperty(p: UMLMember): void {
    this.properties.push(p)
  }

  public addOperation(op: UMLMember): void {
    this.operations.push(op)
  }

  public override getDimensions(): Size {
    // If layout already set dimensions, return them
    if (this.width && this.height) {
      return { width: this.width, height: this.height }
    }

    const { CHAR_WIDTH, LINE_HEIGHT, MIN_WIDTH, PADDING_BOTTOM, SECTION_DIVIDER_HEIGHT } =
      MEASURE_CONFIG

    // Calculate max width
    let maxChars = this.name.length
    this.stereotypes.forEach((st) => {
      maxChars = Math.max(maxChars, st.text.length + 4)
    })

    for (const p of this.properties) {
      maxChars = Math.max(maxChars, p.getFullText().length)
    }
    for (const op of this.operations) {
      maxChars = Math.max(maxChars, op.getFullText().length)
    }

    const PADDING_X = 50
    const calculatedWidth = Math.max(MIN_WIDTH, Math.ceil(maxChars * CHAR_WIDTH + PADDING_X))

    // Calculate height
    const headH = this.getHeaderHeight()
    const propH = this.properties.length * LINE_HEIGHT
    const opH = this.operations.length * LINE_HEIGHT
    const divider =
      this.properties.length > 0 && this.operations.length > 0 ? SECTION_DIVIDER_HEIGHT : 0

    return {
      width: calculatedWidth,
      height: headH + propH + opH + divider + PADDING_BOTTOM,
    }
  }
}
