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
  public receptions: UMLMember[] = []
  public notes: string[] = []

  public addProperty(p: UMLMember): void {
    this.properties.push(p)
  }

  public addOperation(op: UMLMember): void {
    this.operations.push(op)
  }

  public addReception(r: UMLMember): void {
    this.receptions.push(r)
  }

  public addNote(note: string): void {
    this.notes.push(note)
  }

  public override getDimensions(): Size {
    // If layout already set dimensions, return them
    if (this.width && this.height) {
      return { width: this.width, height: this.height }
    }

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
    for (const r of this.receptions) {
      maxChars = Math.max(maxChars, r.getFullText().length)
    }
    for (const n of this.notes) {
      maxChars = Math.max(maxChars, n.length + 2)
    }

    const {
      CHAR_WIDTH,
      PADDING_X,
      MIN_WIDTH,
      LINE_HEIGHT,
      PADDING_BOTTOM,
      SECTION_DIVIDER_HEIGHT,
    } = MEASURE_CONFIG
    const calculatedWidth = Math.max(MIN_WIDTH, Math.ceil(maxChars * CHAR_WIDTH + PADDING_X))

    // Calculate height
    const headH = this.getHeaderHeight()
    const propH = this.properties.length * LINE_HEIGHT
    const opH = this.operations.length * LINE_HEIGHT
    const recepH = this.receptions.length * LINE_HEIGHT
    const notesH = this.notes.length * (LINE_HEIGHT * 0.8) // Notes are smaller

    // Collect tagged values height (from stereotypes)
    let taggedValuesH = 0
    const tagCount = this.countTaggedValues()
    if (tagCount > 0) {
      taggedValuesH = 10 + tagCount * 14
    }

    const activeCompartments = [
      this.properties.length > 0,
      this.operations.length > 0,
      this.receptions.length > 0,
      this.notes.length > 0,
    ].filter(Boolean).length

    const dividerH = activeCompartments > 1 ? (activeCompartments - 1) * SECTION_DIVIDER_HEIGHT : 0

    return {
      width: calculatedWidth,
      height: headH + propH + opH + recepH + notesH + dividerH + taggedValuesH + PADDING_BOTTOM,
    }
  }

  private countTaggedValues(): number {
    let count = 0
    this.stereotypes.forEach((st) => {
      if (st.values && Object.keys(st.values).length > 0) count++
    })
    this.properties.forEach((p) => {
      p.stereotypes.forEach((st) => {
        if (st.values && Object.keys(st.values).length > 0) count++
      })
    })
    this.operations.forEach((op) => {
      op.stereotypes.forEach((st) => {
        if (st.values && Object.keys(st.values).length > 0) count++
      })
    })
    return count
  }
}
