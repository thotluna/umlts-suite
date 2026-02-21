import {
  type UMLNode,
  UMLPackage,
  type UMLHierarchyItem,
  type DiagramModel,
  type UMLEdge,
} from '../core/model/nodes'
import { type IRConstraint } from '@umlts/engine'
import { type LayoutResult, type DiagramConfig } from '../core/types'
import { type Theme } from '../core/theme'
import { SVGBuilder as svg } from './svg-helpers'
import { DrawingRegistry } from './drawable'

// Ensure renderers are registered
import './elements/class-node'
import { renderMarkers, midpoint } from './elements/edges'

/**
 * SVGRenderer: Orchestrates the generation of the SVG string from a layouted result.
 */
export class SVGRenderer {
  public render(
    layoutResult: LayoutResult,
    theme: Theme,
    config?: DiagramConfig['render'],
  ): string {
    const { model, totalWidth, totalHeight } = layoutResult

    // 1. Defs (Markers)
    const defs = renderMarkers(theme)

    // 2. Packages (Backgrounds)
    const packagesStr = model.packages
      .map((pkg: UMLPackage) => this.renderPackage(pkg, theme))
      .join('')

    // 3. Render Top-level Nodes (not in packages)
    const nodesStr = model.nodes
      .filter((n: UMLNode) => !n.namespace)
      .map((node: UMLNode) => DrawingRegistry.render('Node', node, theme, config))
      .join('')

    // 4. Render Edges
    const nodesMap = new Map((model.nodes || []).map((n: UMLNode) => [n.id, n]))
    const edgesStr = model.edges
      .map((edge: UMLEdge) =>
        DrawingRegistry.render('Edge', edge, theme, { ...config, nodes: nodesMap }),
      )
      .join('')

    const constraintsStr = this.renderConstraints(model, theme)

    // Combine everything with proper grouping
    const content =
      defs +
      svg.g({ class: 'packages' }, packagesStr) +
      svg.g({ class: 'edges' }, edgesStr) +
      svg.g({ class: 'nodes' }, nodesStr) +
      svg.g({ class: 'constraints' }, constraintsStr)

    const viewBoxX = layoutResult.bbox?.x ?? 0
    const viewBoxY = layoutResult.bbox?.y ?? 0
    const viewBoxW = layoutResult.bbox?.width ?? totalWidth
    const viewBoxH = layoutResult.bbox?.height ?? totalHeight

    const isResponsive = config?.responsive === true

    const finalWidth = isResponsive ? '100%' : config?.width || viewBoxW
    const finalHeight = isResponsive ? '100%' : config?.height || viewBoxH

    // Bounding box dimensions
    let vbx = Math.floor(viewBoxX)
    let vby = Math.floor(viewBoxY)
    let vbw = Math.ceil(viewBoxW)
    let vbh = Math.ceil(viewBoxH)

    // Applied zoomLevel
    if (config?.zoomLevel && config.zoomLevel !== 1) {
      const scaleFactor = 1 / config.zoomLevel
      const centerX = vbx + vbw / 2
      const centerY = vby + vbh / 2
      vbw = Math.ceil(vbw * scaleFactor)
      vbh = Math.ceil(vbh * scaleFactor)
      vbx = Math.floor(centerX - vbw / 2)
      vby = Math.floor(centerY - vbh / 2)
    }

    return svg.tag(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        width: finalWidth,
        height: finalHeight,
        viewBox: `${vbx} ${vby} ${vbw} ${vbh}`,
        preserveAspectRatio: 'xMidYMid meet',
        style: `background-color: ${theme.canvasBackground}; font-family: ${theme.fontFamily}; display: block;`,
      },
      content,
    )
  }

  /**
   * Renders a UML package and its nested elements recursively.
   */
  private renderPackage(pkg: UMLPackage, theme: Theme, config?: DiagramConfig['render']): string {
    const { x = 0, y = 0, width = 0, height = 0 } = pkg

    // Package body
    const rect = svg.rect({
      x,
      y,
      width,
      height,
      fill: theme.packageBackground,
      stroke: theme.packageBorder,
      'stroke-width': 1.2,
      rx: 8,
    })

    // Package label (tab style)
    const label = svg.text(
      {
        x: x + 10,
        y: y + 20,
        fill: theme.packageLabelText,
        'font-weight': 'bold',
        'font-size': '11px',
        'text-transform': 'uppercase',
        'letter-spacing': '1px',
      },
      pkg.name,
    )

    // 2. Render children (nested packages or nodes)
    const childrenStr = pkg.children
      .map((c: UMLHierarchyItem) => {
        if (c instanceof UMLPackage) {
          return this.renderPackage(c, theme, config)
        }
        return DrawingRegistry.render('Node', c, theme, config)
      })
      .join('')

    return svg.g({ class: 'package', 'data-name': pkg.name }, rect + label + childrenStr)
  }

  /**
   * Renders relationship constraints (like XOR).
   */
  private renderConstraints(model: DiagramModel, theme: Theme): string {
    const xorConstraints = (model.constraints || []).filter((c: IRConstraint) => c.kind === 'xor')
    if (xorConstraints.length === 0) return ''

    return xorConstraints
      .map((constraint: IRConstraint) => {
        const groupId = (constraint.targets as string[])[0]
        const groupEdges = model.edges.filter((e: UMLEdge) =>
          e.constraints?.some(
            (ec: IRConstraint) => ec.kind === 'xor_member' && ec.targets.includes(groupId),
          ),
        )

        if (groupEdges.length < 2) return ''

        const edge1 = groupEdges[0]
        const edge2 = groupEdges[1]

        let commonNodeId: string | null = null
        if (edge1.from === edge2.from) commonNodeId = edge1.from
        else if (edge1.to === edge2.to) commonNodeId = edge1.to
        else if (edge1.from === edge2.to) commonNodeId = edge1.from
        else if (edge1.to === edge2.from) commonNodeId = edge1.to

        if (!commonNodeId) {
          const p1 = midpoint(edge1.waypoints!)
          const p2 = midpoint(edge2.waypoints!)
          return this.drawXorElements([p1, p2], theme)
        }

        const p1 = this.getPointNearNode(edge1, commonNodeId, 70)
        const p2 = this.getPointNearNode(edge2, commonNodeId, 70)

        return this.drawXorElements([p1, p2], theme)
      })
      .join('')
  }

  /**
   * Obtiene un punto en la arista a una distancia fija desde el nodo indicado.
   */
  private getPointNearNode(
    edge: { from: string; waypoints?: Array<{ x: number; y: number }> },
    nodeId: string,
    distance: number,
  ): { x: number; y: number } {
    const wps = edge.waypoints || []
    const fromStart = edge.from === nodeId
    const points = fromStart ? wps : [...wps].reverse()

    let currentDist = 0
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]
      const b = points[i + 1]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const len = Math.sqrt(dx * dx + dy * dy)

      if (currentDist + len >= distance) {
        const ratio = (distance - currentDist) / len
        return { x: a.x + dx * ratio, y: a.y + dy * ratio }
      }
      currentDist += len
    }
    return points[points.length - 1]
  }

  /**
   * Dibuja los elementos visuales del XOR (línea y etiqueta).
   */
  private drawXorElements(points: { x: number; y: number }[], theme: Theme): string {
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

    const line = svg.path({
      d,
      fill: 'none',
      stroke: theme.edgeStroke,
      'stroke-width': 1.2,
      'stroke-dasharray': '5,5',
    })

    const labelX = (points[0].x + points[1].x) / 2
    const labelY = (points[0].y + points[1].y) / 2

    const bg = svg.rect({
      x: labelX - 22,
      y: labelY - 10,
      width: 44,
      height: 20,
      fill: theme.canvasBackground,
      stroke: theme.edgeStroke,
      'stroke-width': 0.5,
      rx: 4,
    })

    const label = svg.text(
      {
        x: labelX,
        y: labelY,
        fill: theme.edgeStroke,
        'font-size': '13px',
        'font-weight': 'bold',
        'font-style': 'italic',
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
      },
      '{xor}',
    )

    return svg.g({ class: 'constraint-xor' }, line + bg + label)
  }
}
