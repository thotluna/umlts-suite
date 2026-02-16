import {
  type LayoutResult,
  UMLPackage,
  type UMLHierarchyItem,
  type DiagramConfig,
  type DiagramModel,
} from '../core/types'
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
    // 2. Render Packages
    const packagesStr = model.packages.map((pkg) => this.renderPackage(pkg, theme)).join('')

    // 3. Render Top-level Nodes (not in packages)
    const nodesStr = model.nodes
      .filter((n) => !n.namespace)
      .map((node) => DrawingRegistry.render('Node', node, theme, config))
      .join('')

    // 4. Render Edges
    const nodesMap = new Map(model.nodes.map((n) => [n.id, n]))
    const edgesStr = model.edges
      .map((edge, _idx) =>
        DrawingRegistry.render('Edge', edge, theme, { ...config, nodes: nodesMap }),
      )
      .join('')

    const constraintsStr = this.renderConstraints(model, theme)

    // Combine everything with proper grouping
    const content =
      defs +
      svg.g({ class: 'packages' }, packagesStr) +
      svg.g({ class: 'edges' }, edgesStr) +
      svg.g({ class: 'constraints' }, constraintsStr) +
      svg.g({ class: 'nodes' }, nodesStr)

    const viewBoxX = layoutResult.bbox?.x ?? 0
    const viewBoxY = layoutResult.bbox?.y ?? 0
    const viewBoxW = layoutResult.bbox?.width ?? totalWidth
    const viewBoxH = layoutResult.bbox?.height ?? totalHeight

    // Responsive handling
    const isResponsive = config?.responsive === true // Cambiamos a false por defecto

    // Si NO es responsive, usamos el tamaño real del dibujo (bbox).
    // Esto es vital para que visualizadores externos y el Webview puedan aplicar zoom manual sobre píxeles reales.
    const finalWidth = isResponsive ? '100%' : config?.width || viewBoxW
    const finalHeight = isResponsive ? '100%' : config?.height || viewBoxH

    // Redondeamos los valores del viewBox
    let vbx = Math.floor(viewBoxX)
    let vby = Math.floor(viewBoxY)
    let vbw = Math.ceil(viewBoxW)
    let vbh = Math.ceil(viewBoxH)

    // Aplicar zoomLevel si existe (1.0 = escala natural, > 1.0 acerca, < 1.0 aleja)
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
        // Eliminamos width/height del style para evitar conflictos con los atributos y forzamos block
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
    const xorConstraints = (model.constraints || []).filter((c) => c.kind === 'xor')
    if (xorConstraints.length === 0) return ''

    return xorConstraints
      .map((constraint) => {
        const groupId = (constraint.targets as string[])[0]
        const groupEdges = model.edges.filter((e) =>
          e.constraints?.some((ec) => ec.kind === 'xor_member' && ec.targets.includes(groupId)),
        )

        if (groupEdges.length < 2) return ''

        // Get midpoints of all involved edges
        const points = groupEdges
          .filter((e) => e.waypoints && e.waypoints.length >= 2)
          .map((e) => midpoint(e.waypoints!))

        if (points.length < 2) return ''

        // Draw a dashed path connecting the midpoints
        // We generate a simple path connecting them in sequence
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

        const line = svg.path({
          d,
          fill: 'none',
          stroke: theme.edgeStroke,
          'stroke-width': 1,
          'stroke-dasharray': '4,4',
        })

        // Draw the {xor} label at the center of the first segment for simplicity
        const labelX = (points[0].x + points[1].x) / 2
        const labelY = (points[0].y + points[1].y) / 2

        const label = svg.text(
          {
            x: labelX,
            y: labelY - 5,
            fill: theme.edgeStroke,
            'font-size': '10px',
            'font-style': 'italic',
            'text-anchor': 'middle',
          },
          '{xor}',
        )

        return svg.g({ class: 'constraint-xor' }, line + label)
      })
      .join('')
  }
}
