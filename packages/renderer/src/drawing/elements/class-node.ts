import {
  type UMLNode,
  UMLCompartmentNode,
  UMLGenericClass,
  UMLGenericInterface,
  UMLClass,
  UMLEnum,
} from '../../core/model/index'
import { MEASURE_CONFIG } from '../../core/model/base/measure-constants'
import { type DiagramConfig } from '../../core/types'
import { type Theme } from '../../core/theme'
import { SVGBuilder as svg } from '../svg-helpers'
import { DrawingRegistry } from '../drawable'

/**
 * Renders a single UML Entity (Class, Interface, or Enum) into an SVG group.
 */
export function renderClassNode(
  node: UMLNode,
  theme: Theme,
  _options?: DiagramConfig['render'],
): string {
  const { x = 0, y = 0, width = 140, height = 40 } = node

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
  if (node instanceof UMLClass && node.isActive) {
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

  const isAbstract = node instanceof UMLClass && node.isAbstract
  const isStatic = node instanceof UMLClass && node.isStatic
  const isLeaf = node instanceof UMLClass && node.isLeaf

  if (isAbstract) {
    headerLines.push({ text: '«abstract»', size: theme.fontSizeSmall })
    stereotypeCount++
  }
  if (isStatic) {
    headerLines.push({ text: '«static»', size: theme.fontSizeSmall })
    stereotypeCount++
  }
  if (isLeaf) {
    headerLines.push({ text: '{leaf}', size: theme.fontSizeSmall })
    stereotypeCount++
  }

  headerLines.push({
    text: node.name,
    size: theme.fontSizeBase,
    isBold: true,
    isItalic: isAbstract,
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

  const { PADDING_X, LINE_HEIGHT: CFG_LINE_HEIGHT } = MEASURE_CONFIG
  const MARGIN_X = PADDING_X / 2

  if (node instanceof UMLCompartmentNode) {
    // 1. Properties
    for (const prop of node.properties) {
      membersContent += svg.text(
        {
          x: x + MARGIN_X,
          y: memberY,
          fill: theme.nodeMemberText,
          'font-size': theme.fontSizeBase,
          'text-decoration': prop.isStatic ? 'underline' : 'none',
        },
        svg.escape(prop.getFullText()),
      )
      memberY += CFG_LINE_HEIGHT
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
      membersContent += svg.text(
        {
          x: x + MARGIN_X,
          y: memberY,
          fill: theme.nodeMemberText,
          'font-size': theme.fontSizeBase,
          'font-style': op.isAbstract ? 'italic' : 'normal',
          'text-decoration': op.isStatic ? 'underline' : 'none',
        },
        svg.escape(op.getFullText()),
      )
      memberY += CFG_LINE_HEIGHT
    }
  }

  // 1.3 Enum Literals
  if (node instanceof UMLEnum) {
    for (const literal of node.literals) {
      membersContent += svg.text(
        {
          x: x + MARGIN_X,
          y: memberY,
          fill: theme.nodeMemberText,
          'font-size': theme.fontSizeBase,
        },
        svg.escape(literal.text),
      )
      memberY += CFG_LINE_HEIGHT
    }
  }

  // Template Parameters (Generics) - UML Standard: dashed box in top-right
  let templateBoxStr = ''
  if (
    (node instanceof UMLGenericClass || node instanceof UMLGenericInterface) &&
    node.templateBox
  ) {
    const { CHAR_WIDTH: CFG_CHAR_WIDTH } = MEASURE_CONFIG
    const paramsText = node.templateBox.parameters.map((p) => p.text).join(', ')
    const boxWidth = Math.max(30, paramsText.length * CFG_CHAR_WIDTH + 10)
    const boxHeight = 20
    const boxX = x + width - boxWidth / 2
    const boxY = y - boxHeight / 2

    templateBoxStr = svg.g(
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
    {
      class: 'node',
      'data-id': node.id,
      'data-type': node.type.toLowerCase(),
      cursor: 'pointer',
    },
    bg + activeLines + headerSep + headerContent + membersContent + templateBoxStr,
  )
}

// Register as Node renderer for all concrete class types
const nodeTypes = [
  'Node',
  'Class',
  'ActiveClass',
  'StaticClass',
  'GenericClass',
  'Interface',
  'GenericInterface',
  'Enum',
  'DataType',
]

nodeTypes.forEach((type) => {
  DrawingRegistry.register(type, (node: unknown, theme: Theme, options?: unknown) =>
    renderClassNode(node as UMLNode, theme, options as DiagramConfig['render']),
  )
})
