import { UMLNode, IRMember, DiagramConfig } from '../../core/types'
import { Theme } from '../../core/theme'
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

  // Header separator
  const headerSep = svg.line(x, y + HEADER_HEIGHT, x + width, y + HEADER_HEIGHT, {
    stroke: theme.nodeDivider,
    'stroke-width': 1,
  })

  // Stereotype and Name
  let currentY = y + 14
  let headerContent = ''

  if (node.type !== 'Class') {
    headerContent += svg.text(
      {
        x: x + width / 2,
        y: currentY,
        'text-anchor': 'middle',
        fill: theme.nodeHeaderText,
        'font-size': theme.fontSizeSmall,
      },
      `«${node.type.toLowerCase()}»`,
    )
    currentY += 14
  } else if (node.isAbstract) {
    headerContent += svg.text(
      {
        x: x + width / 2,
        y: currentY,
        'text-anchor': 'middle',
        fill: theme.nodeHeaderText,
        'font-size': theme.fontSizeSmall,
      },
      `«abstract»`,
    )
    currentY += 14
  } else if (node.isStatic) {
    headerContent += svg.text(
      {
        x: x + width / 2,
        y: currentY,
        'text-anchor': 'middle',
        fill: theme.nodeHeaderText,
        'font-size': theme.fontSizeSmall,
      },
      `«static»`,
    )
    currentY += 14
  }

  headerContent += svg.text(
    {
      x: x + width / 2,
      y: node.type === 'Class' && !node.isAbstract && !node.isStatic ? y + 20 : currentY,
      'text-anchor': 'middle',
      fill: theme.nodeHeaderText,
      'font-weight': 'bold',
      'font-style': node.isAbstract ? 'italic' : 'normal',
      'font-size': theme.fontSizeBase,
    },
    node.name,
  )

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
      .map((p) => {
        const pLabel = p.type ? `${p.name}: ${p.type}` : p.name
        return pLabel
      })
      .join(', ')
    label += `(${params})`
  }

  if (m.type) {
    label += `: ${m.type}`
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
