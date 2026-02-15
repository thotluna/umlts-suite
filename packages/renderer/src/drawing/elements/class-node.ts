import { type UMLNode, type IRMember, type IRParameter, type DiagramConfig } from '../../core/types'
import { type Theme } from '../../core/theme'
import { SVGBuilder as svg } from '../svg-helpers'
import { DrawingRegistry } from '../drawable'

/**
 * Renders a single UML Entity (Class, Interface, or Enum) into an SVG group.
 */
/**
 * Renders a single UML Entity (Class, Interface, or Enum) into an SVG group.
 */
export function renderClassNode(
  node: UMLNode,
  theme: Theme,
  options?: DiagramConfig['render'],
): string {
  const { x = 0, y = 0, width = 160, height = 40 } = node

  const HEADER_HEIGHT = 32
  const LINE_HEIGHT = 24

  // Background and border
  const bg = svg.rect({
    x,
    y,
    width,
    height,
    fill: theme.nodeBackground,
    stroke: theme.nodeBorder,
    'stroke-width': 1.5,
    rx: 2,
  })

  // Active Class double border (Vertical lines on the sides)
  let activeLines = ''
  if (node.isActive) {
    activeLines += svg.line(x + 5, y, x + 5, y + height, {
      stroke: theme.nodeActiveLine,
      'stroke-width': 1,
    })
    activeLines += svg.line(x + width - 5, y, x + width - 5, y + height, {
      stroke: theme.nodeActiveLine,
      'stroke-width': 1,
    })
  }

  // Header separator and content
  const HEADER_HEIGHT_NORMAL = 32
  let stereotypeCount = 0
  const headerLines: { text: string; size: number; isBold?: boolean; isItalic?: boolean }[] = []

  if (node.type !== 'Class') {
    headerLines.push({ text: `«${node.type.toLowerCase()}»`, size: theme.fontSizeSmall })
    stereotypeCount++
  }
  if (node.isAbstract) {
    headerLines.push({ text: '«abstract»', size: theme.fontSizeSmall })
    stereotypeCount++
  }
  if (node.isStatic) {
    headerLines.push({ text: '«static»', size: theme.fontSizeSmall })
    stereotypeCount++
  }
  if (node.isLeaf) {
    headerLines.push({ text: '{leaf}', size: theme.fontSizeSmall })
    stereotypeCount++
  }
  if (node.isFinal) {
    headerLines.push({ text: '«final»', size: theme.fontSizeSmall })
    stereotypeCount++
  }
  if (node.isRoot) {
    headerLines.push({ text: '{root}', size: theme.fontSizeSmall })
    stereotypeCount++
  }

  headerLines.push({
    text: node.name,
    size: theme.fontSizeBase,
    isBold: true,
    isItalic: node.isAbstract,
  })

  // We use the same calculation as in measureNodeDimensions to ensure visual consistency
  const headerHeight = HEADER_HEIGHT_NORMAL + stereotypeCount * 14
  const headerSep = svg.line(x, y + headerHeight, x + width, y + headerHeight, {
    stroke: theme.nodeDivider,
    'stroke-width': 1,
  })

  let headerContent = ''
  // Center all lines in headerHeight
  const totalContentHeight = headerLines.length * 14
  let currentY = y + (headerHeight - totalContentHeight) / 2 + 10

  for (const line of headerLines) {
    headerContent += svg.text(
      {
        x: x + width / 2,
        y: currentY,
        'text-anchor': 'middle',
        fill: theme.nodeHeaderText,
        'font-size': line.size,
        'font-weight': line.isBold ? 'bold' : 'normal',
        'font-style': line.isItalic ? 'italic' : 'normal',
      },
      line.text,
    )
    currentY += 14
  }

  // Members (Attributes and Methods)
  let membersContent = ''
  let memberY = y + HEADER_HEIGHT + 18

  // Attributes
  for (const attr of node.attributes) {
    membersContent += renderMember(attr, x + 10, memberY, theme, options)
    memberY += LINE_HEIGHT
  }

  // Section divider if needed
  if (node.attributes.length > 0 && node.methods.length > 0) {
    membersContent += svg.line(x, memberY - 14, x + width, memberY - 14, {
      stroke: theme.nodeDivider,
      'stroke-width': 0.5,
      'stroke-dasharray': '2,2',
    })
  }

  // Methods
  for (const meth of node.methods) {
    membersContent += renderMember(meth, x + 10, memberY, theme, options)
    memberY += LINE_HEIGHT
  }

  return svg.g(
    { class: 'node', 'data-id': node.id, cursor: 'pointer' },
    bg + activeLines + headerSep + headerContent + membersContent,
  )
}

function renderMember(
  m: IRMember,
  x: number,
  y: number,
  theme: Theme,
  options?: DiagramConfig['render'],
): string {
  const showVisibility = options?.showVisibility !== false
  let label = showVisibility ? `${m.visibility} ${m.name}` : m.name

  if (m.parameters !== undefined) {
    const params = m.parameters
      .map((p: IRParameter) => {
        const pLabel = p.type ? `${p.name}: ${p.type}` : p.name
        return pLabel
      })
      .join(', ')
    label += `(${params})`
  }

  if (m.type) {
    label += `: ${m.type}`
  }

  if (m.isLeaf) {
    label += ' {leaf}'
  } else if (m.isFinal) {
    label += ' {final}'
  }

  if (m.multiplicity) {
    label += ` [${m.multiplicity}]`
  }

  return svg.text(
    {
      x,
      y,
      fill: theme.nodeMemberText,
      'font-size': theme.fontSizeBase,
      'font-style': m.isAbstract ? 'italic' : 'normal',
      'text-decoration': m.isStatic ? 'underline' : 'none',
    },
    label,
  )
}

// Register as Node renderer
DrawingRegistry.register('Node', (node: unknown, theme: Theme, options?: unknown) =>
  renderClassNode(node as UMLNode, theme, options as DiagramConfig['render']),
)
