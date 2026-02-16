import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import {
  type DiagramModel,
  type UMLNode,
  type UMLEdge,
  UMLPackage,
  type LayoutResult,
  type DiagramConfig,
} from '../core/types'
import { measureText } from './measure'

const elk = new ELK()

// ─── ELK option keys ──────────────────────────────────────────────────────────
// ELK requires the FULL qualified key (with "elk." prefix) at every level.
// Omitting the prefix is one of the most common silent-fail causes.
//
// NOTE: Using minimal options to avoid ELK.js bug with cross-package edges.
// Complex layout options (advanced placement strategies, edge label configs, etc.)
// cause "Cannot read properties of undefined" errors when edges connect nodes
// in different packages. We keep only essential spacing and padding.

const BASE_LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
  'elk.edgeRouting': 'UNDEFINED',

  // Spacing optimizations
  'elk.spacing.nodeNode': '50',
  'elk.layered.spacing.nodeNodeBetweenLayers': '60',
  'elk.spacing.componentComponent': '70',
  'elk.padding': '[top=50,left=50,bottom=50,right=50]',
  'elk.separateConnectedComponents': 'true',
  'elk.layered.mergeEdges': 'false',
  'elk.portConstraints': 'FREE',

  // Long Hierarchical Edges optimizations
  'elk.layered.spacing.edgeEdgeBetweenLayers': '25',
  'elk.layered.spacing.edgeNodeBetweenLayers': '25',
  'elk.layered.unnecessaryEdgeBends': 'true',
  'elk.layered.compaction': 'true',

  // Layered specifics to reduce crossing and "messy" look
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
}

/**
 * LayoutEngine: Uses ELK.js to calculate positions and routing for the diagram elements.
 */
export class LayoutEngine {
  public async layout(
    model: DiagramModel,
    config?: DiagramConfig['layout'],
  ): Promise<LayoutResult> {
    // Prepare layout options based on configuration
    const layoutOptions: Record<string, string> = { ...BASE_LAYOUT_OPTIONS }

    if (config?.direction) {
      layoutOptions['elk.direction'] = config.direction
    }

    if (config?.spacing) {
      const s = config.spacing.toString()
      layoutOptions['elk.spacing.nodeNode'] = s
      layoutOptions['elk.layered.spacing.nodeNodeBetweenLayers'] = s
      layoutOptions['elk.spacing.componentComponent'] = s
      layoutOptions['elk.spacing.edgeNode'] = (config.spacing * 0.5).toString()
    }

    if (config?.nodePadding) {
      const p = config.nodePadding
      layoutOptions['elk.padding'] = `[top=${p},left=${p},bottom=${p},right=${p}]`
    }

    if (config?.routing) {
      layoutOptions['elk.edgeRouting'] = config.routing
    }

    const edgesByLCA = this.groupEdgesByLCA(model, layoutOptions)

    // 1. Convert to ELK format recursively
    // Nodes that are not part of any package (i.e., top-level nodes)
    const topLevelNodes = model.nodes.filter((n) => !n.namespace)

    const elkChildren: ElkNode[] = [
      ...topLevelNodes.map((n) => this.toElkNode(n)),
      ...model.packages.map((p) => this.pkgToElk(p, edgesByLCA, layoutOptions)),
    ]

    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions,
      children: elkChildren,
      edges: edgesByLCA.get('root') ?? [],
    }

    // Validate graph before sending to ELK
    this.validateElkGraph(elkGraph)

    const layoutedGraph = await elk.layout(elkGraph)

    this.applyLayout(model, layoutedGraph)

    // Calculate real bounding box of all elements to have a tight viewBox
    const bbox = this.calculateModelBoundingBox(model)

    return {
      model,
      totalWidth: layoutedGraph.width ?? 800,
      totalHeight: layoutedGraph.height ?? 600,
      bbox,
    }
  }

  // ── ELK graph builders ────────────────────────────────────────────────────

  /**
   * Converts a DiagramPackage to an ElkNode.
   */
  private pkgToElk(
    pkg: UMLPackage,
    edgesByLCA: Map<string, ElkExtendedEdge[]>,
    layoutOptions: Record<string, string>,
  ): ElkNode {
    const pkgId = pkg.id || pkg.name
    const children: ElkNode[] = pkg.children.map((child) => {
      if (child instanceof UMLPackage) {
        return this.pkgToElk(child, edgesByLCA, layoutOptions)
      }
      return this.toElkNode(child as UMLNode)
    })

    return {
      id: pkgId,
      layoutOptions,
      children,
      edges: edgesByLCA.get(pkgId) ?? [],
    }
  }

  private toElkNode(node: UMLNode): ElkNode {
    const { width, height } = node.getDimensions()

    return {
      id: node.id,
      width,
      height,
      layoutOptions: {
        'elk.portConstraints': 'UNDEFINED',
      },
    }
  }

  /**
   * Groups edges by the ID of the package that is their Lowest Common Ancestor.
   */
  private groupEdgesByLCA(
    model: DiagramModel,
    _layoutOptions: Record<string, string>,
  ): Map<string, ElkExtendedEdge[]> {
    const groups = new Map<string, ElkExtendedEdge[]>()
    model.edges.forEach((edge, index) => {
      const lcaId = this.findLCA(edge.from, edge.to)

      const elkEdge: ElkExtendedEdge = {
        id: `e${index}`,
        sources: [edge.from],
        targets: [edge.to],
      }

      if (edge.label) {
        const { width, height } = measureText(edge.label, 11)
        elkEdge.labels = [
          {
            id: `l${index}`,
            text: edge.label,
            width,
            height,
          },
        ]
      }

      if (!groups.has(lcaId)) groups.set(lcaId, [])
      groups.get(lcaId)!.push(elkEdge)

      if (edge.associationClassId) {
        // We create a virtual chain: Source -> AssociationClass -> Target
        // This encourages ELK to place the association class "between" the participants.
        const chain = [
          { s: edge.from, t: edge.associationClassId!, id: `v${index}_s` },
          { s: edge.associationClassId!, t: edge.to, id: `v${index}_t` },
        ]

        chain.forEach((link) => {
          const vLcaId = this.findLCA(link.s, link.t)
          const vElkEdge: ElkExtendedEdge = {
            id: link.id,
            sources: [link.s],
            targets: [link.t],
            layoutOptions: {
              'elk.edge.weight': '10', // High attraction
            },
          }
          if (!groups.has(vLcaId)) groups.set(vLcaId, [])
          groups.get(vLcaId)!.push(vElkEdge)
        })
      }
    })

    // ── XOR Constraint Virtual Edges ─────────────────────────────────────────
    model.constraints.forEach((constraint, cIdx) => {
      if (constraint.kind === 'xor' && constraint.targets.length === 1) {
        const groupId = constraint.targets[0]
        const groupEdges = model.edges.filter((e) =>
          e.constraints?.some((ec) => ec.kind === 'xor_member' && ec.targets.includes(groupId)),
        )

        if (groupEdges.length > 1) {
          // Identify all distinct endpoints involved in the XOR group
          const endpoints = new Set<string>()
          groupEdges.forEach((e) => {
            endpoints.add(e.from)
            endpoints.add(e.to)
          })

          const endpointArray = Array.from(endpoints)

          // Inject virtual edges between all pairs of endpoints to keep them close
          // This creates a "cluster" effect for the XOR participants.
          for (let i = 0; i < endpointArray.length; i++) {
            for (let j = i + 1; j < endpointArray.length; j++) {
              const s = endpointArray[i]
              const t = endpointArray[j]
              const vLcaId = this.findLCA(s, t)
              const vElkEdge: ElkExtendedEdge = {
                id: `v_xor_${cIdx}_${i}_${j}`,
                sources: [s],
                targets: [t],
                layoutOptions: {
                  'elk.edge.weight': '5', // Moderate attraction
                },
              }
              if (!groups.has(vLcaId)) groups.set(vLcaId, [])
              groups.get(vLcaId)!.push(vElkEdge)
            }
          }
        }
      }
    })

    return groups
  }

  /**
   * Finds the common package ID for two node IDs.
   * Assumes IDs are FQN separated by dots.
   */
  private findLCA(id1: string, id2: string): string {
    const p1 = id1.split('.')
    const p2 = id2.split('.')

    // We want the common prefix excluding the last part (the class name)
    const common: string[] = []
    const len = Math.min(p1.length - 1, p2.length - 1)

    for (let i = 0; i < len; i++) {
      if (p1[i] === p2[i]) {
        common.push(p1[i])
      } else {
        break
      }
    }

    return common.length > 0 ? common.join('.') : 'root'
  }

  // ── Layout application ────────────────────────────────────────────────────

  private applyLayout(model: DiagramModel, layoutedGraph: ElkNode): void {
    this.processElkNodes(layoutedGraph.children ?? [], model, 0, 0)
    this.processElkEdges(layoutedGraph, model, 0, 0)
  }

  /**
   * Maps ELK coordinates back to our model.
   */
  private processElkNodes(
    elkNodes: ElkNode[],
    model: DiagramModel,
    offsetX: number,
    offsetY: number,
  ): void {
    const nodesById = new Map<string, UMLNode>(model.nodes.map((n) => [n.id, n]))
    const pkgsById = new Map<string, UMLPackage>()

    const collectPkgs = (pkgs: UMLPackage[]) => {
      for (const p of pkgs) {
        if (p.id) pkgsById.set(p.id, p)
        collectPkgs(p.children.filter((c): c is UMLPackage => c instanceof UMLPackage))
      }
    }
    collectPkgs(model.packages)

    for (const elkNode of elkNodes) {
      const node = nodesById.get(elkNode.id)
      const pkg = pkgsById.get(elkNode.id)

      if (node != null) {
        node.updateLayout(
          (elkNode.x || 0) + offsetX,
          (elkNode.y || 0) + offsetY,
          elkNode.width || 0,
          elkNode.height || 0,
        )
      } else if (pkg != null) {
        pkg.updateLayout(
          (elkNode.x || 0) + offsetX,
          (elkNode.y || 0) + offsetY,
          elkNode.width || 0,
          elkNode.height || 0,
        )
        // Recursive for children
        this.processElkNodes(
          elkNode.children ?? [],
          model,
          (elkNode.x || 0) + offsetX,
          (elkNode.y || 0) + offsetY,
        )
      }
    }
  }

  /**
   * Maps ELK waypoints back to our model.
   * Edges are relative to their immediate container ELK node.
   */
  private processElkEdges(
    container: ElkNode,
    model: DiagramModel,
    offsetX: number,
    offsetY: number,
  ): void {
    const edgesByEntities = new Map<string, UMLEdge>(
      model.edges.map((e) => [`${e.from}->${e.to}`, e]),
    )

    if (container.edges != null) {
      for (const elkEdge of container.edges) {
        const sourceId = this.stripPort(elkEdge.sources[0])
        const targetId = this.stripPort(elkEdge.targets[0])
        const edgeKey = `${sourceId}->${targetId}`
        const edge = edgesByEntities.get(edgeKey)

        if (edge != null && elkEdge.sections != null && elkEdge.sections[0]) {
          const section = elkEdge.sections[0]
          const waypoints: Array<{ x: number; y: number }> = []

          // Start Point
          waypoints.push({
            x: section.startPoint.x + offsetX,
            y: section.startPoint.y + offsetY,
          })

          // Bend Points
          if (section.bendPoints != null) {
            for (const bp of section.bendPoints) {
              waypoints.push({
                x: bp.x + offsetX,
                y: bp.y + offsetY,
              })
            }
          }

          // End Point
          waypoints.push({
            x: section.endPoint.x + offsetX,
            y: section.endPoint.y + offsetY,
          })

          // Label Position
          let labelPos
          let labelWidth
          let labelHeight

          if (elkEdge.labels != null && elkEdge.labels[0]) {
            const l = elkEdge.labels[0]
            labelPos = { x: (l.x || 0) + offsetX, y: (l.y || 0) + offsetY }
            labelWidth = l.width
            labelHeight = l.height
          }

          edge.updateLayout(waypoints, labelPos, labelWidth, labelHeight)
        }
      }
    }

    // Recursively process edges in sub-packages
    for (const child of container.children ?? []) {
      // Offset for sub-container is its absolute position
      this.processElkEdges(child, model, offsetX + (child.x || 0), offsetY + (child.y || 0))
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Calcula el área real ocupada únicamente por los elementos visuales (nodos y aristas).
   * Ignoramos las dimensiones de los paquetes porque ELK les asigna tamaños con
   * márgenes que queremos eliminar en el encuadre inicial.
   */
  private calculateModelBoundingBox(model: DiagramModel) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const MARGIN = 30 // Margen de seguridad alrededor del contenido

    // 1. Considerar solo Nodos
    for (const node of model.nodes) {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + node.width)
      maxY = Math.max(maxY, node.y + node.height)
    }

    // 2. Considerar Paquetes de forma recursiva
    const includePackages = (pkgs: UMLPackage[]) => {
      for (const pkg of pkgs) {
        minX = Math.min(minX, pkg.x)
        minY = Math.min(minY, pkg.y)
        maxX = Math.max(maxX, pkg.x + pkg.width)
        maxY = Math.max(maxY, pkg.y + pkg.height)

        // El label del paquete puede sobresalir por arriba (el tab del paquete)
        // Por ahora asumimos que pkg.y ya incluye el inicio del dibujo del paquete.

        includePackages(pkg.children.filter((c): c is UMLPackage => c instanceof UMLPackage))
      }
    }
    includePackages(model.packages)

    // 3. Considerar Aristas
    for (const edge of model.edges) {
      if (edge.waypoints != null) {
        for (const wp of edge.waypoints) {
          minX = Math.min(minX, wp.x)
          minY = Math.min(minY, wp.y)
          maxX = Math.max(maxX, wp.x)
          maxY = Math.max(maxY, wp.y)
        }
      }
      if (edge.labelPos != null) {
        minX = Math.min(minX, edge.labelPos.x)
        minY = Math.min(minY, edge.labelPos.y)
        maxX = Math.max(maxX, edge.labelPos.x + (edge.labelWidth || 0))
        maxY = Math.max(maxY, edge.labelPos.y + (edge.labelHeight || 0))
      }
    }

    // Fallback si no hay elementos
    if (minX === Infinity) return { x: 0, y: 0, width: 800, height: 600 }

    return {
      x: minX - MARGIN,
      y: minY - MARGIN,
      width: maxX - minX + MARGIN * 2,
      height: maxY - minY + MARGIN * 2,
    }
  }

  private stripPort(id: string): string {
    if (!id) return ''
    const lastDot = id.lastIndexOf('.')
    if (lastDot === -1) return id
    const suffix = id.substring(lastDot + 1)
    if (['n', 's', 'e', 'w'].includes(suffix)) {
      return id.substring(0, lastDot)
    }
    return id
  }

  private findPackage(packages: UMLPackage[], id: string): UMLPackage | undefined {
    for (const pkg of packages) {
      if (pkg.id === id) return pkg
      const nested = pkg.children.filter((c): c is UMLPackage => c instanceof UMLPackage)
      const found = this.findPackage(nested, id)
      if (found != null) return found
    }
    return undefined
  }

  /**
   * Validates the ELK graph structure to catch common issues before layout.
   */
  private validateElkGraph(node: ElkNode, path = 'root'): void {
    // Check node has ID
    if (!node.id) {
      console.error(`[ELK Validation] Node at ${path} has no ID!`)
    }

    // Check children have width/height
    if (node.children != null) {
      node.children.forEach((child, idx) => {
        const childPath = `${path}.children[${idx}]`

        // If it's a leaf node (no children), it must have width/height
        if (child.children == null || child.children.length === 0) {
          if (child.width === undefined || child.height === undefined) {
            console.error(
              `[ELK Validation] Leaf node ${child.id} at ${childPath} missing width/height!`,
            )
          }
        }

        // Recursively validate children
        this.validateElkGraph(child, childPath)
      })
    }

    // Check edges reference valid nodes
    if (node.edges != null) {
      const allNodeIds = this.collectAllElkNodeIds(node)

      node.edges.forEach((edge, idx) => {
        if (!edge.sources || edge.sources.length === 0) {
          console.error(`[ELK Validation] Edge ${edge.id} at ${path}.edges[${idx}] has no sources!`)
        }
        if (!edge.targets || edge.targets.length === 0) {
          console.error(`[ELK Validation] Edge ${edge.id} at ${path}.edges[${idx}] has no targets!`)
        }

        edge.sources?.forEach((sourceId) => {
          if (!allNodeIds.has(sourceId)) {
            console.error(`[ELK Validation] Edge ${edge.id} references unknown source: ${sourceId}`)
            console.error('[ELK Validation] Available nodes:', Array.from(allNodeIds))
          }
        })

        edge.targets?.forEach((targetId) => {
          if (!allNodeIds.has(targetId)) {
            console.error(`[ELK Validation] Edge ${edge.id} references unknown target: ${targetId}`)
            console.error('[ELK Validation] Available nodes:', Array.from(allNodeIds))
          }
        })
      })
    }
  }

  /**
   * Collects all node IDs recursively from an ELK graph.
   */
  private collectAllElkNodeIds(node: ElkNode): Set<string> {
    const ids = new Set<string>()

    if (node.id) {
      ids.add(node.id)
    }

    if (node.children != null) {
      node.children.forEach((child) => {
        const childIds = this.collectAllElkNodeIds(child)
        childIds.forEach((id) => ids.add(id))
      })
    }

    return ids
  }
}
