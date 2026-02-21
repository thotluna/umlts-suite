import {
  type IRProperty,
  type IROperation,
  type IRParameter,
  type IRMultiplicity,
} from '@umlts/engine'
import { type UMLNode } from '../../core/model/nodes'
import { type DiagramConfig } from '../../core/types'
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

  const LINE_HEIGHT = 24
  const HEADER_LINE_HEIGHT = 16

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
  const HEADER_HEIGHT_NORMAL = 40
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
  const totalContentHeight = headerLines.length * HEADER_LINE_HEIGHT
  let currentY = y + (headerHeight - totalContentHeight) / 2 + HEADER_LINE_HEIGHT / 2

  for (const line of headerLines) {
    const isStereotype = line.text.startsWith('«') || line.text.startsWith('{')
    headerContent += svg.text(
      {
        x: x + width / 2,
        y: currentY,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        fill: theme.nodeHeaderText,
        'font-size': line.size,
        'font-weight': line.isBold ? 'bold' : 'normal',
        'font-style': line.isItalic ? 'italic' : 'normal',
        opacity: isStereotype ? 0.8 : 1,
      },
      svg.escape(line.text),
    )
    currentY += HEADER_LINE_HEIGHT
  }

  // Members (Attributes and Methods)
  let membersContent = ''
  let memberY = y + headerHeight + 20 // Start after header with padding

  // 1. Properties
  for (const prop of node.properties) {
    membersContent += renderProperty(prop, x + 10, memberY, theme, options)
    memberY += LINE_HEIGHT
  }

  // Section divider if needed
  if (node.properties.length > 0 && node.operations.length > 0) {
    membersContent += svg.line(x, memberY - 14, x + width, memberY - 14, {
      stroke: theme.nodeDivider,
      'stroke-width': 0.5,
      'stroke-dasharray': '2,2',
    })
  }

  // 2. Operations
  for (const op of node.operations) {
    membersContent += renderOperation(op, x + 10, memberY, theme, options)
    memberY += LINE_HEIGHT
  }

  // Template Parameters (Generics) - UML Standard: dashed box in top-right
  let templateBox = ''
  if (node.typeParameters && node.typeParameters.length > 0) {
    const paramsText = node.typeParameters.join(', ')
    const boxWidth = Math.max(30, paramsText.length * 8 + 10)
    const boxHeight = 20
    const boxX = x + width - boxWidth / 2
    const boxY = y - boxHeight / 2

    templateBox = svg.g(
      {},
      svg.rect({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        fill: theme.nodeBackground,
        stroke: theme.nodeBorder,
        'stroke-width': 1,
        'stroke-dasharray': '3,3',
      }) +
        svg.text(
          {
            x: boxX + boxWidth / 2,
            y: boxY + boxHeight / 2 + 4,
            'text-anchor': 'middle',
            fill: theme.nodeHeaderText,
            'font-size': theme.fontSizeSmall,
          },
          svg.escape(paramsText),
        ),
    )
  }

  return svg.g(
    { class: 'node', 'data-id': node.id, cursor: 'pointer' },
    bg + activeLines + headerSep + headerContent + membersContent + templateBox,
  )
}

function formatMultiplicity(m?: IRMultiplicity): string {
  if (!m) return ''
  if (m.lower === m.upper) return `[${m.lower}]`
  return `[${m.lower}..${m.upper}]`
}

function renderProperty(
  p: IRProperty,
  x: number,
  y: number,
  theme: Theme,
  options?: DiagramConfig['render'],
): string {
  const showVisibility = options?.showVisibility !== false
  let label = showVisibility ? `${p.visibility} ${p.name}` : p.name

  if (p.type) {
    label += `: ${p.type}`
  }

  if (p.multiplicity) {
    label += ` ${formatMultiplicity(p.multiplicity)}`
  }

  if (p.isLeaf) {
    label += ' {leaf}'
  }

  return svg.text(
    {
      x,
      y,
      fill: theme.nodeMemberText,
      'font-size': theme.fontSizeBase,
      'text-decoration': p.isStatic ? 'underline' : 'none',
    },
    svg.escape(label),
  )
}

function renderOperation(
  op: IROperation,
  x: number,
  y: number,
  theme: Theme,
  options?: DiagramConfig['render'],
): string {
  const showVisibility = options?.showVisibility !== false
  let label = showVisibility ? `${op.visibility} ${op.name}` : op.name

  const params = op.parameters
    .map((p: IRParameter) => {
      let pLabel = p.type ? `${p.name}: ${p.type}` : p.name
      if (p.multiplicity) pLabel += formatMultiplicity(p.multiplicity)
      return pLabel
    })
    .join(', ')

  label += `(${params})`

  if (op.returnType) {
    label += `: ${op.returnType}`
    if (op.returnMultiplicity) label += ` ${formatMultiplicity(op.returnMultiplicity)}`
  }

  if (op.isLeaf) {
    label += ' {leaf}'
  }

  return svg.text(
    {
      x,
      y,
      fill: theme.nodeMemberText,
      'font-size': theme.fontSizeBase,
      'font-style': op.isAbstract ? 'italic' : 'normal',
      'text-decoration': op.isStatic ? 'underline' : 'none',
    },
    svg.escape(label),
  )
}

// Register as Node renderer
DrawingRegistry.register('Node', (node: unknown, theme: Theme, options?: unknown) =>
  renderClassNode(node as UMLNode, theme, options as DiagramConfig['render']),
)
