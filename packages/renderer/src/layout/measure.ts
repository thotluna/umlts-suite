import {
  UMLSpatialNode,
  UMLCompartmentNode,
  UMLGenericClass,
  UMLGenericInterface,
  UMLEnum,
  UMLHeaderShape,
} from '../core/model/index'

/**
 * Approximate constants for text measurement without a real DOM.
 */
import { MEASURE_CONFIG } from '../core/model/base/measure-constants'

const {
  CHAR_WIDTH,
  LINE_HEIGHT,
  HEADER_HEIGHT_NORMAL,
  PADDING_BOTTOM,
  MIN_WIDTH,
  SECTION_DIVIDER_HEIGHT,
} = MEASURE_CONFIG

export interface NodeDimensions {
  width: number
  height: number
}

export interface TextDimensions {
  width: number
  height: number
}

export function measureNodeDimensions(node: UMLSpatialNode): NodeDimensions {
  // 1. Calculate max width by checking all possible content
  let maxChars = node.name.length
  if (node instanceof UMLHeaderShape && node.nameContent?.isItalic) {
    maxChars *= 1.1
  }

  // Stereotypes width
  if (node instanceof UMLHeaderShape) {
    node.stereotypes.forEach((st) => {
      maxChars = Math.max(maxChars, st.text.length + 4)
    })
  }

  if (node.isAbstract) {
    maxChars = Math.max(maxChars, 12) // <<abstract>>
  }

  // Template/Generic params width
  let genericOverhead = 0
  if (node instanceof UMLGenericClass || node instanceof UMLGenericInterface) {
    if (node.templateBox) {
      const dim = node.templateBox.getDimensions()
      genericOverhead = dim.width / 2 // Box sticks out halfway
    }
  }

  // Compartment members width
  if (node instanceof UMLCompartmentNode) {
    for (const p of node.properties) {
      maxChars = Math.max(maxChars, p.getFullText().length)
    }
    for (const op of node.operations) {
      maxChars = Math.max(maxChars, op.getFullText().length)
    }
  }

  // Enum literals width
  if (node instanceof UMLEnum) {
    for (const lit of node.literals) {
      maxChars = Math.max(maxChars, lit.text.length + 4)
    }
  }

  const PADDING_X = 50 // Premium horizontal breathing room
  const width = Math.max(MIN_WIDTH, Math.ceil(maxChars * CHAR_WIDTH + PADDING_X + genericOverhead))

  // 2. Calculate height
  let memberCount = 0
  let dividerHeight = 0

  if (node instanceof UMLCompartmentNode) {
    memberCount = node.properties.length + node.operations.length
    if (node.properties.length > 0 && node.operations.length > 0) {
      dividerHeight = SECTION_DIVIDER_HEIGHT
    }
  } else if (node instanceof UMLEnum) {
    memberCount = node.literals.length
  }

  // Real height calculation
  let currentHeaderHeight: number = HEADER_HEIGHT_NORMAL
  if (node instanceof UMLHeaderShape) {
    currentHeaderHeight = node.getHeaderHeight()
  }

  const height = currentHeaderHeight + memberCount * LINE_HEIGHT + dividerHeight + PADDING_BOTTOM

  return { width, height }
}

/**
 * Approximates the dimensions of a single line of text.
 */
export function measureText(text: string, fontSize = 12): TextDimensions {
  const scale = fontSize / 13
  return {
    width: Math.ceil(text.length * CHAR_WIDTH * scale),
    height: Math.ceil(LINE_HEIGHT * scale),
  }
}

/**
 * Internal helper to wrap text for notes.
 */
function wrapNoteText(text: string, maxChars: number): string[] {
  const rawLines = text.split('\n')
  const wrappedLines: string[] = []

  for (const line of rawLines) {
    if (line.length <= maxChars) {
      wrappedLines.push(line)
      continue
    }

    const words = line.split(/\s+/)
    let currentLine = ''
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) wrappedLines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) wrappedLines.push(currentLine)
  }
  return wrappedLines
}

/**
 * Approximate dimensions for a Note with word wrap support.
 */
export function measureNoteDimensions(note: { text: string }): NodeDimensions {
  const MAX_CHARS = 40
  const lines = wrapNoteText(note.text, MAX_CHARS)
  const maxLineChars = Math.max(...lines.map((l) => l.length), 15)
  const width = Math.ceil(maxLineChars * CHAR_WIDTH * 0.75 + 30)
  const height = Math.ceil(lines.length * 20 + 30)
  return { width: Math.max(140, width), height: Math.max(60, height) }
}
