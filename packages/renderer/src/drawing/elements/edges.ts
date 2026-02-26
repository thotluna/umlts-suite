import { type UMLEdge } from '../../core/model/nodes'
import { type DiagramConfig } from '../../core/types'
import { type Theme } from '../../core/theme'
import { SVGBuilder as svg } from '../svg-helpers'
import { DrawingRegistry } from '../drawable'
import { normalizeMultiplicity } from '../../adaptation/multiplicity'

// ─── Constants ────────────────────────────────────────────────────────────────

// Offset for multiplicity labels relative to the waypoint
const LABEL_OFFSET = 12

/**
 * How many px to retract each end of the path so the marker
 * sits fully outside the node border.
 */
const END_CLEARANCE: Record<string, number> = {
  Generalization: 13,
  GENERALIZATION: 13,
  Inheritance: 13,
  INHERITANCE: 13,
  InterfaceRealization: 13,
  INTERFACE_REALIZATION: 13,
  Implementation: 13,
  IMPLEMENTATION: 13,
  Association: 11,
  ASSOCIATION: 11,
  Dependency: 11,
  DEPENDENCY: 11,
  Usage: 11,
  USAGE: 11,
  Composition: 2,
  COMPOSITION: 2,
  Aggregation: 2,
  AGGREGATION: 2,
  Bidirectional: 2,
  BIDIRECTIONAL: 2,
}

const START_CLEARANCE: Record<string, number> = {
  Composition: 20,
  COMPOSITION: 20,
  Aggregation: 20,
  AGGREGATION: 20,
  Generalization: 2,
  GENERALIZATION: 2,
  Inheritance: 2,
  INHERITANCE: 2,
  InterfaceRealization: 2,
  INTERFACE_REALIZATION: 2,
  Implementation: 2,
  IMPLEMENTATION: 2,
  Association: 2,
  ASSOCIATION: 2,
  Dependency: 2,
  DEPENDENCY: 2,
  Usage: 2,
  USAGE: 2,
  Bidirectional: 2,
  BIDIRECTIONAL: 2,
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Renders a single UML relationship edge (path + markers + labels).
 */
export function renderEdge(
  edge: UMLEdge,
  index: number,
  theme: Theme,
  options?: DiagramConfig['render'],
): string {
  if (edge.waypoints == null || edge.waypoints.length < 2) return ''

  const wps = edge.waypoints
  const type = edge.type as string

  const endClear = END_CLEARANCE[type] ?? 13
  const startClear = START_CLEARANCE[type] ?? 2

  // Retract both ends so markers sit outside node borders
  const trimmed = trimStart(trimEnd(wps, endClear), startClear)

  const d = trimmed.map((wp, i) => `${i === 0 ? 'M' : 'L'} ${wp.x} ${wp.y}`).join(' ')

  const isDashed =
    type === 'Implementation' ||
    type === 'IMPLEMENTATION' ||
    type === 'InterfaceRealization' ||
    type === 'INTERFACE_REALIZATION' ||
    type === 'Dependency' ||
    type === 'DEPENDENCY' ||
    type === 'Usage' ||
    type === 'USAGE'

  const isDiamond =
    type === 'Composition' ||
    type === 'COMPOSITION' ||
    type === 'Aggregation' ||
    type === 'AGGREGATION'

  const isBidirectional = type === 'Bidirectional' || type === 'BIDIRECTIONAL'

  const pathEl = svg.path({
    d,
    fill: 'none',
    stroke: theme.edgeStroke,
    'stroke-width': theme.edgeStrokeWidth,
    ...(isDashed ? { 'stroke-dasharray': '6,4' } : {}),
    ...(!isBidirectional &&
      (isDiamond
        ? { 'marker-start': `url(#marker-${type.toLowerCase()})` }
        : { 'marker-end': `url(#marker-${type.toLowerCase()})` })),
  })

  // ── Multiplicity labels ──────────────────────────────────────────────────
  const labels: string[] = []

  if (edge.fromMultiplicity) {
    const pos = labelPos(wps[0], wps[1], LABEL_OFFSET)
    labels.push(
      svg.text(
        {
          x: pos.x,
          y: pos.y,
          fill: theme.multiplicityText,
          'font-size': theme.fontSizeSmall,
          'text-anchor': pos.anchor,
        },
        svg.escape(normalizeMultiplicity(edge.fromMultiplicity)),
      ),
    )
  }

  if (edge.toMultiplicity) {
    const n = wps.length
    const pos = labelPos(wps[n - 1], wps[n - 2], LABEL_OFFSET)
    labels.push(
      svg.text(
        {
          x: pos.x,
          y: pos.y,
          fill: theme.multiplicityText,
          'font-size': theme.fontSizeSmall,
          'text-anchor': pos.anchor,
        },
        svg.escape(normalizeMultiplicity(edge.toMultiplicity)),
      ),
    )
  }

  if (edge.label) {
    const showVisibility = options?.showVisibility !== false
    const visibility = showVisibility && edge.visibility ? `${edge.visibility} ` : ''
    const displayText = `${visibility}${edge.label}`

    let x: number, y: number
    let textAnchor = 'middle'

    if (edge.labelPos != null) {
      x = edge.labelPos.x + (edge.labelWidth ? edge.labelWidth / 2 : 0)
      y = edge.labelPos.y + (edge.labelHeight ? edge.labelHeight / 2 : 0)
    } else {
      const mid = midpoint(wps)
      x = mid.x + 4
      y = mid.y - 4
      textAnchor = 'start'
    }

    const labelLines = displayText.split('\n')
    const lineHeight = 14

    labels.push(
      svg.text(
        {
          x,
          y: y - ((labelLines.length - 1) * lineHeight) / 2,
          fill: theme.multiplicityText,
          'font-size': theme.fontSizeSmall,
          'font-style': 'italic',
          'text-anchor': textAnchor,
          'dominant-baseline': 'central',
        },
        labelLines
          .map(
            (line, i) =>
              `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${svg.escape(line)}</tspan>`,
          )
          .join(''),
      ),
    )
  }

  // ── Constraints ──────────────────────────────────────────────────────────
  if (edge.constraints && edge.constraints.length > 0) {
    const visibleConstraints = edge.constraints.filter((c) => c.kind !== 'xor_member')
    if (visibleConstraints.length === 0) return ''

    const expressions = visibleConstraints.map((c) =>
      c.expression && c.expression !== c.kind ? `${c.kind}: ${c.expression}` : c.kind,
    )
    const constraintText = `{${expressions.join(', ')}}`

    const mid = midpoint(wps)
    // Offset slightly from the label if it exists
    const offsetY = edge.label ? 15 : 0

    labels.push(
      svg.text(
        {
          x: mid.x + 4,
          y: mid.y - 4 + offsetY,
          fill: theme.edgeStroke,
          'font-size': theme.fontSizeSmall,
          'text-anchor': 'start',
          'dominant-baseline': 'central',
        },
        svg.escape(constraintText),
      ),
    )
  }

  const extraElements: string[] = []
  const renderOptions = options as DiagramConfig['render']

  if (edge.associationClassId && renderOptions?.nodes) {
    const assocNode = renderOptions.nodes.get(edge.associationClassId)

    if (assocNode) {
      const mid = midpoint(wps)
      const centerX = assocNode.x + assocNode.width / 2
      const centerY = assocNode.y + assocNode.height / 2

      const dx = mid.x - centerX
      const dy = mid.y - centerY

      let targetX = centerX
      let targetY = centerY

      if (dx !== 0 || dy !== 0) {
        const halfW = assocNode.width / 2
        const halfH = assocNode.height / 2
        const sx = Math.abs(halfW / dx)
        const sy = Math.abs(halfH / dy)
        const s = Math.min(sx, sy)
        targetX = centerX + dx * s
        targetY = centerY + dy * s
      }

      extraElements.push(
        svg.path({
          d: `M ${mid.x} ${mid.y} L ${targetX} ${targetY}`,
          fill: 'none',
          stroke: theme.edgeStroke,
          'stroke-width': theme.edgeStrokeWidth,
          'stroke-dasharray': '5,5',
        }),
      )
    }
  }

  return svg.g(
    {
      class: 'edge',
      'data-from': edge.from,
      'data-to': edge.to,
      'data-type': type.toLowerCase(),
      'data-index': index,
    },
    pathEl + labels.join('') + extraElements.join(''),
  )
}

export function renderMarkers(theme: Theme): string {
  const bg = theme.nodeBackground
  const stroke = theme.edgeStroke

  return svg.tag(
    'defs',
    {},
    `
    <marker id="marker-inheritance" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 13 7 L 1 13 Z" fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/></marker>
    <marker id="marker-generalization" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 13 7 L 1 13 Z" fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/></marker>
    <marker id="marker-implementation" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 13 7 L 1 13 Z" fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/></marker>
    <marker id="marker-interfacerealization" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="12" markerHeight="12" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 13 7 L 1 13 Z" fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/></marker>
    <marker id="marker-composition" viewBox="0 0 20 14" refX="1" refY="7" markerWidth="18" markerHeight="12" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M 1 7 L 10 1 L 19 7 L 10 13 Z" fill="${stroke}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1"/></marker>
    <marker id="marker-aggregation" viewBox="0 0 20 14" refX="1" refY="7" markerWidth="18" markerHeight="12" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M 1 7 L 10 1 L 19 7 L 10 13 Z" fill="${bg}" stroke="${stroke}" stroke-linejoin="round" stroke-width="1.5"/></marker>
    <marker id="marker-association" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 10 6 L 1 11" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="marker-dependency" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 10 6 L 1 11" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker>
    <marker id="marker-usage" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 1 L 10 6 L 1 11" fill="none" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker>
  `,
  )
}

interface Point {
  x: number
  y: number
}

function trimEnd(wps: Point[], dist: number): Point[] {
  if (wps.length < 2 || dist <= 0) return wps
  const result = wps.slice(0, -1)
  const a = wps[wps.length - 2]
  const b = wps[wps.length - 1]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len <= dist) return result
  result.push({ x: b.x - (dx / len) * dist, y: b.y - (dy / len) * dist })
  return result
}

function trimStart(wps: Point[], dist: number): Point[] {
  if (wps.length < 2 || dist <= 0) return wps
  const a = wps[0]
  const b = wps[1]
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len <= dist) return wps.slice(1)
  return [{ x: a.x + (dx / len) * dist, y: a.y + (dy / len) * dist }, ...wps.slice(1)]
}

function labelPos(
  anchor: Point,
  next: Point,
  offset: number,
): { x: number; y: number; anchor: string } {
  const dx = next.x - anchor.x
  const dy = next.y - anchor.y
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const x = anchor.x + ux * offset + px * (offset * 0.8)
  const y = anchor.y + uy * offset + py * (offset * 0.8)
  return { x, y, anchor: px >= 0 ? 'start' : 'end' }
}

export function midpoint(wps: Point[] | undefined): Point {
  if (!wps || wps.length === 0) return { x: 0, y: 0 }
  const mid = Math.floor(wps.length / 2)
  if (wps.length % 2 === 1) return wps[mid]
  const a = wps[mid - 1]
  const b = wps[mid]
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

DrawingRegistry.register('Edge', (edge: unknown, theme: Theme, options?: unknown) =>
  renderEdge(edge as UMLEdge, 0, theme, options as DiagramConfig['render']),
)
