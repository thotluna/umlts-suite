import { type IRParameter } from '@umlts/engine'
import { type UMLNode } from '../core/model/nodes'

/**
 * Approximate constants for text measurement without a real DOM.
 * These values are calibrated for a standard monospace font at 13px.
 */
const CHAR_WIDTH = 11.5 // More conservative to avoid clipping
const LINE_HEIGHT = 26 // More compact but safe
const HEADER_HEIGHT_NORMAL = 40
const PADDING_BOTTOM = 8
const MIN_WIDTH = 160

export interface NodeDimensions {
  width: number
  height: number
}

export interface TextDimensions {
  width: number
  height: number
}

/**
 * Internal helper to calculate node dimensions.
 * Migrated to UMLNode.getDimensions()
 */
export function measureNodeDimensions(node: UMLNode): NodeDimensions {
  // 1. Calculate max width based on the longest string
  let maxChars = node.name.length

  // Stereotypes like «interface», «enum», «abstract», «static», leaf, final, root add to width and height
  let stereotypeCount = 0
  if (node.type !== 'Class') {
    maxChars = Math.max(maxChars, node.type.length + 4)
    stereotypeCount++
  }
  if (node.isAbstract) {
    maxChars = Math.max(maxChars, 12) // «abstract»
    stereotypeCount++
  }
  if (node.isStatic) {
    maxChars = Math.max(maxChars, 10) // «static»
    stereotypeCount++
  }
  if (node.isLeaf) {
    maxChars = Math.max(maxChars, 6) // {leaf}
    stereotypeCount++
  }

  // Generics like <T, K> (UML Standard: Template Parameter Box)
  let genericOverhead = 0
  if (node.typeParameters && node.typeParameters.length > 0) {
    const genericsStr = node.typeParameters.join(', ')
    // The box hangs out by half its width on the right
    const boxWidth = Math.max(30, genericsStr.length * 8 + 10)
    genericOverhead = boxWidth / 2
    maxChars = Math.max(maxChars, node.name.length) // Name doesn't need to fit <T> in title anymore
  }

  // 1. Properties
  for (const p of node.properties) {
    let memberChars = 2 + p.name.length + 3 + (p.type?.length || 0)
    if (p.multiplicity) {
      const multStr = `${p.multiplicity.lower}..${p.multiplicity.upper}`
      memberChars += multStr.length + 2
    }
    if (p.constraints) memberChars += p.constraints.length * 8
    if (p.notes) memberChars += p.notes.join(', ').length + 4
    maxChars = Math.max(maxChars, memberChars)
  }

  // 2. Operations
  for (const op of node.operations) {
    const paramsChars = op.parameters.reduce(
      (acc: number, p: IRParameter) =>
        acc + p.name.length + (p.type?.length || 0) + 3 + (p.notes?.join(', ').length || 0),
      0,
    )
    let memberChars = 2 + op.name.length + paramsChars + 2 + 3 + (op.returnType?.length || 0)
    if (op.constraints) memberChars += op.constraints.length * 8
    if (op.notes) memberChars += op.notes.join(', ').length + 4
    maxChars = Math.max(maxChars, memberChars)
  }

  const width = Math.max(MIN_WIDTH, Math.ceil(maxChars * CHAR_WIDTH + 20 + genericOverhead)) // +20 for padding + overhead

  // 2. Calculate height
  // Header + Properties Section + Operations Section
  const memberCount = node.properties.length + node.operations.length
  // We add some extra height if we have both properties and operations for the divider
  const sectionDividerHeight = node.properties.length > 0 && node.operations.length > 0 ? 8 : 0

  const currentHeaderHeight = HEADER_HEIGHT_NORMAL + stereotypeCount * 14
  const height =
    currentHeaderHeight + memberCount * LINE_HEIGHT + sectionDividerHeight + PADDING_BOTTOM

  return { width, height }
}

/**
 * Approximates the dimensions of a single line of text.
 */
export function measureText(text: string, fontSize = 12): TextDimensions {
  const scale = fontSize / 13 // CHAR_WIDTH is calibrated for 13px
  return {
    width: Math.ceil(text.length * CHAR_WIDTH * scale),
    height: Math.ceil(LINE_HEIGHT * scale),
  }
}
