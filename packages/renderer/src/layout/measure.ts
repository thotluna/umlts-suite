import { type UMLNode, type IRParameter } from '../core/types'

/**
 * Approximate constants for text measurement without a real DOM.
 * These values are calibrated for a standard monospace font at 13px.
 */
const CHAR_WIDTH = 11.5 // More conservative to avoid clipping
const LINE_HEIGHT = 26 // More compact but safe
const HEADER_HEIGHT_NORMAL = 32
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
  if (node.isFinal) {
    maxChars = Math.max(maxChars, 7) // «final»
    stereotypeCount++
  }
  if (node.isRoot) {
    maxChars = Math.max(maxChars, 6) // {root}
    stereotypeCount++
  }

  // Generics like <T, K>
  if (node.typeParameters.length > 0) {
    const genericsStr = `<${node.typeParameters.join(', ')}>`
    maxChars = Math.max(maxChars, genericsStr.length)
  }

  // Members
  const allMembers = [...node.attributes, ...node.methods]
  for (const m of allMembers) {
    // Basic representation: visibility + name + : + type + multiplicity
    let memberChars = 2 + m.name.length + 3 + (m.type?.length || 0)
    if (m.multiplicity) memberChars += m.multiplicity.length + 2
    if (m.parameters != null) {
      // Methods also have parameters (name: type)
      const paramsChars = m.parameters.reduce(
        (acc: number, p: IRParameter) => acc + p.name.length + (p.type?.length || 0) + 3,
        0,
      )
      memberChars += paramsChars + 2 // +2 for ()
    }
    maxChars = Math.max(maxChars, memberChars)
  }

  const width = Math.max(MIN_WIDTH, Math.ceil(maxChars * CHAR_WIDTH + 20)) // +20 for padding

  // 2. Calculate height
  // Header + Attributes Section + Methods Section
  const memberCount = allMembers.length
  // We add some extra height if we have both attributes and methods for the divider
  const sectionDividerHeight = node.attributes.length > 0 && node.methods.length > 0 ? 8 : 0

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
