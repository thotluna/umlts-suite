import {
  UMLPackage,
  UMLNote,
  type DiagramModel,
  type UMLEdge,
  type UMLNode,
} from '../core/model/index'
import { type LayoutResult, type DiagramConfig } from '../core/types'
import { type Theme } from '../core/theme'
import { SVGBuilder as svg } from './svg-helpers'
import { DrawingRegistry } from './drawable'

// Ensure renderers are registered
import './elements/class-node'
import './elements/note'
import { renderMarkers, midpoint } from './elements/edges'

import { type IDrawingEngine } from '../core/contract'

/**
 * SVGRenderer: Orchestrates the generation of the SVG string from a layouted result.
 */
export class SVGRenderer implements IDrawingEngine<string> {
  public draw(
    layoutResult: LayoutResult,
    theme: Theme,
    config: DiagramConfig['render'] = {},
  ): string {
    const { model, totalWidth, totalHeight } = layoutResult

    // 1. Defs (Markers)
    const defs = renderMarkers(theme)

    // 2. Render Hierarchy (Backgrounds only)
    const packagesStr = model.packages
      .map((pkg: UMLPackage) => this.renderPackageBackground(pkg, theme))
      .join('')

    // 3. Render Content (Nodes and Edges separated by layers)
    // Layer 1: Edges (behind nodes)
    const edgesStr = this.renderEdges(model, theme, config)
    const anchorsStr = this.renderAnchors(model, theme)
    const constraintsStr = this.renderConstraints(model, theme)

    // Layer 2: All Nodes (on top of edges)
    const nodesStr = this.renderAllNodes(model, theme, config)
    const notesStr = this.renderAllNotes(model, theme, config)

    // Combine everything with proper z-index layers
    const content =
      defs +
      svg.g({ class: 'packages-layer' }, packagesStr) +
      svg.g({ class: 'edges-layer' }, edgesStr) +
      svg.g({ class: 'anchors-layer' }, anchorsStr) +
      svg.g({ class: 'nodes-layer' }, nodesStr) +
      svg.g({ class: 'notes-layer' }, notesStr) +
      svg.g({ class: 'constraints-layer' }, constraintsStr)

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
   * Renders relationship edges.
   */
  private renderEdges(model: DiagramModel, theme: Theme, config?: DiagramConfig['render']): string {
    const nodesMap = new Map((model.nodes || []).map((n: UMLNode) => [n.id, n]))
    return model.edges
      .map((edge: UMLEdge) =>
        DrawingRegistry.render('Edge', edge, theme, { ...config, nodes: nodesMap }),
      )
      .join('')
  }

  /**
   * Renders all nodes (flat).
   */
  private renderAllNodes(
    model: DiagramModel,
    theme: Theme,
    config?: DiagramConfig['render'],
  ): string {
    return model.nodes
      .map((node: UMLNode) => DrawingRegistry.render('Node', node, theme, config))
      .join('')
  }

  /**
   * Renders all notes (flat).
   */
  private renderAllNotes(
    model: DiagramModel,
    theme: Theme,
    config?: DiagramConfig['render'],
  ): string {
    return (model.notes || [])
      .map((note: UMLNote) => DrawingRegistry.render('Note', note, theme, config))
      .join('')
  }

  /**
   * Renders a UML package background and its tab recursively.
   */
  private renderPackageBackground(
    pkg: UMLPackage,
    theme: Theme,
    config?: DiagramConfig['render'],
  ): string {
    const { x = 0, y = 0, width = 0, height = 0 } = pkg

    const tabHeight = 25
    const tabWidth = Math.max(width * 0.3, 110)
    const r = 8

    // Drawing a unified "folder" shape
    const d = `
      M ${x}, ${y + tabHeight}
      L ${x}, ${y + 6}
      A 6,6 0 0 1 ${x + 6}, ${y}
      L ${x + tabWidth - 6}, ${y}
      A 6,6 0 0 1 ${x + tabWidth}, ${y + 6}
      L ${x + tabWidth}, ${y + tabHeight}
      L ${x + width - r}, ${y + tabHeight}
      A r,r 0 0 1 ${x + width}, ${y + tabHeight + r}
      L ${x + width}, ${y + height - r}
      A r,r 0 0 1 ${x + width - r}, ${y + height}
      L ${x + r}, ${y + height}
      A r,r 0 0 1 ${x}, ${y + height - r}
      Z
    `
      .replace(/r,r/g, `${r},${r}`)
      .replace(/\s+/g, ' ')
      .trim()

    const body = svg.path({
      d,
      fill: theme.packageBackground,
      stroke: theme.packageBorder,
      'stroke-width': 1.2,
      rx: 2,
    })

    const label = svg.text(
      {
        x: x + tabWidth / 2,
        y: y + tabHeight / 2,
        fill: theme.packageLabelText,
        'font-weight': 'bold',
        'font-size': '11px',
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'text-transform': 'uppercase',
        'letter-spacing': '1px',
      },
      pkg.name,
    )

    // Only recursive package backgrounds
    const nestedBackgrounds = pkg.children
      .filter((c): c is UMLPackage => c instanceof UMLPackage)
      .map((p) => this.renderPackageBackground(p, theme, config))
      .join('')

    return svg.g({ class: 'package-bg', 'data-name': pkg.name }, body + label + nestedBackgrounds)
  }

  /**
   * Renders connectors between notes and their targets.
   */
  private renderAnchors(model: DiagramModel, theme: Theme): string {
    return (model.anchors || [])
      .flatMap((anchor) => {
        const fromNode = this.findElementById(anchor.fromId, model)
        if (!fromNode) return []

        return anchor.toIds.map((targetId: string) => {
          const toNode = this.findElementById(targetId, model)
          if (!toNode) return ''

          const c1 = { x: fromNode.x + fromNode.width / 2, y: fromNode.y + fromNode.height / 2 }
          const c2 = { x: toNode.x + toNode.width / 2, y: toNode.y + toNode.height / 2 }

          const dx = c2.x - c1.x
          const dy = c2.y - c1.y

          let p1 = { ...c1 }
          let p2 = { ...c2 }

          if (dx !== 0 || dy !== 0) {
            // Intersection with 'from' rect
            const s1 = Math.min(
              fromNode.width > 0 ? Math.abs(fromNode.width / 2 / dx) : 0,
              fromNode.height > 0 ? Math.abs(fromNode.height / 2 / dy) : 0,
            )
            p1 = { x: c1.x + dx * s1, y: c1.y + dy * s1 }

            // Intersection with 'to' rect
            const s2 = Math.min(
              toNode.width > 0 ? Math.abs(toNode.width / 2 / dx) : 0,
              toNode.height > 0 ? Math.abs(toNode.height / 2 / dy) : 0,
            )
            p2 = { x: c2.x - dx * s2, y: c2.y - dy * s2 }
          }

          let d = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`

          if (anchor.waypoints && anchor.waypoints.length > 0) {
            d = anchor.waypoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
          }

          return svg.path({
            d,
            fill: 'none',
            stroke: theme.edgeStroke,
            'stroke-width': 1,
            'stroke-dasharray': '4,4',
          })
        })
      })
      .join('')
  }

  /**
   * Renders relationship constraints (like XOR).
   */
  private renderConstraints(model: DiagramModel, theme: Theme): string {
    const xorConstraints = (model.constraints || []).filter((c) => c.kind === 'xor')
    if (xorConstraints.length === 0) return ''

    return xorConstraints
      .map((constraint) => {
        const groupId = constraint.targets[0]
        if (!groupId) return ''

        // Find edges that belong to this XOR group
        const groupEdges = model.edges.filter((e) => {
          const groups = e.metadata.get('groups') as string[] | undefined
          return groups?.includes(groupId)
        })

        if (groupEdges.length < 2) return ''

        const edge1 = groupEdges[0]
        const edge2 = groupEdges[1]

        const node1 = this.findElementById(edge1.from, model)
        const node2 = this.findElementById(edge2.from, model)
        const node3 = this.findElementById(edge1.to, model)
        const node4 = this.findElementById(edge2.to, model)

        let commonNodeId: string | null = null
        if (node1 && node2 && node1.id === node2.id) commonNodeId = node1.id
        else if (node3 && node4 && node3.id === node4.id) commonNodeId = node3.id
        else if (node1 && node4 && node1.id === node4.id) commonNodeId = node1.id
        else if (node2 && node3 && node2.id === node3.id) commonNodeId = node2.id

        if (!commonNodeId) {
          const p1 = midpoint(edge1.waypoints!)
          const p2 = midpoint(edge2.waypoints!)
          return this.drawXorElements([p1, p2], theme)
        }

        const p1 = this.getPointNearNode(edge1, commonNodeId, 55)
        const p2 = this.getPointNearNode(edge2, commonNodeId, 55)

        if (!isFinite(p1.x) || !isFinite(p1.y) || !isFinite(p2.x) || !isFinite(p2.y)) {
          return ''
        }

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
    if (wps.length === 0) return { x: 0, y: 0 }

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

    // Fallback if edge is shorter than distance
    if (points.length >= 2) {
      const a = points[0]
      const b = points[points.length - 1]
      return { x: a.x + (b.x - a.x) * 0.4, y: a.y + (b.y - a.y) * 0.4 }
    }

    return points[points.length - 1] || { x: 0, y: 0 }
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

  /**
   * Finds a node or note by ID, supporting both exact FQN matches and simple name matches.
   */
  private findElementById(id: string, model: DiagramModel): (UMLNode | UMLNote) | undefined {
    const all = [...model.nodes, ...model.notes]

    // 1. Exact match
    const exact = all.find((e) => e.id === id)
    if (exact) return exact

    // 2. Suffix match (e.g. "PrimaryNode" matches "TestGroup.PrimaryNode")
    const suffix = all.find((e) => e.id.endsWith('.' + id))
    if (suffix) return suffix

    return undefined
  }
}
