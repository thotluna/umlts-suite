import ELK, { type ElkNode, type ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js'
import {
  type UMLNode,
  UMLPackage,
  type UMLHierarchyItem,
  type DiagramModel,
  type UMLEdge,
} from '../model/nodes'
import { type ILayoutStrategy } from '../contract'
import { type LayoutResult, type DiagramConfig } from '../types'
import { measureText } from '../../layout/measure'
import { DiagramConfig as ConfigOrchestrator } from '../../graph-orchestrator/diagram-config'
import { UMLScorer } from '../../layout/uml-scorer'
import { UMLNote } from '../model/nodes'

const elk = new ELK()

/**
 * ClassLayoutStrategy: Specialized layout strategy for UML Class Diagrams.
 * It uses ELK.js as the underlying engine but applies UML-specific
 * rules for weights, scores, and hierarchy.
 */
export class ClassLayoutStrategy implements ILayoutStrategy {
  public supports(_model: DiagramModel): boolean {
    // For now, this is the default for any model that hasn't specified a type
    return true
  }

  public async layout(
    model: DiagramModel,
    config?: DiagramConfig['layout'],
  ): Promise<LayoutResult> {
    const layoutOptions = new ConfigOrchestrator(config).getLayoutOptions()

    // 1. Pre-calculate UML priorities and weights
    const nodeStats = UMLScorer.calculateNodeStats(model)
    const edgesByLCA = this.groupEdgesByLCA(model, layoutOptions)

    // 2. Build ELK Hierarchy
    const topLevelNodes = model.nodes.filter((n: UMLNode) => !n.namespace)
    const topLevelNotes = (model.notes || []).filter((n: UMLNote) => !n.namespace)

    const elkChildren: ElkNode[] = [
      ...topLevelNodes.map((n: UMLNode) => this.toElkNode(n, nodeStats.get(n.id)?.score)),
      ...topLevelNotes.map((n: UMLNote) => this.noteToElkNode(n)),
      ...model.packages.map((p: UMLPackage) =>
        this.pkgToElk(p, edgesByLCA, layoutOptions, nodeStats),
      ),
    ]

    const elkGraph: ElkNode = {
      id: 'root',
      layoutOptions,
      children: elkChildren,
      edges: edgesByLCA.get('root') ?? [],
    }

    // 3. Execution
    const layoutedGraph = await elk.layout(elkGraph)

    // 4. Back-propagation to Domain Model
    this.applyLayout(model, layoutedGraph)

    const bbox = this.calculateModelBoundingBox(model)

    return {
      model,
      totalWidth: layoutedGraph.width ?? 800,
      totalHeight: layoutedGraph.height ?? 600,
      bbox,
    }
  }

  private pkgToElk(
    pkg: UMLPackage,
    edgesByLCA: Map<string, ElkExtendedEdge[]>,
    layoutOptions: Record<string, string>,
    nodeStats: Map<string, { score: number }>,
  ): ElkNode {
    const pkgId = pkg.id || pkg.name
    const children: ElkNode[] = pkg.children.map((child) => {
      if (child instanceof UMLPackage) {
        return this.pkgToElk(child, edgesByLCA, layoutOptions, nodeStats)
      }
      if (child instanceof UMLNote) {
        return this.noteToElkNode(child)
      }
      const node = child as UMLNode
      return this.toElkNode(node, nodeStats.get(node.id)?.score)
    })

    return {
      id: pkgId,
      layoutOptions,
      children,
      edges: edgesByLCA.get(pkgId) ?? [],
    }
  }

  private toElkNode(node: UMLNode, score?: number): ElkNode {
    const { width, height } = node.getDimensions()
    const options: Record<string, string> = {
      'elk.portConstraints': 'UNDEFINED',
    }

    if (score !== undefined) {
      options['elk.priority'] = Math.max(1, score + 50).toString()
    }

    return {
      id: node.id,
      width,
      height,
      layoutOptions: options,
    }
  }

  private noteToElkNode(note: UMLNote): ElkNode {
    const { width, height } = note.getDimensions()
    return {
      id: note.id,
      width,
      height,
      layoutOptions: {
        'elk.portConstraints': 'UNDEFINED',
      },
    }
  }

  private groupEdgesByLCA(
    model: DiagramModel,
    _layoutOptions: Record<string, string>,
  ): Map<string, ElkExtendedEdge[]> {
    const groups = new Map<string, ElkExtendedEdge[]>()

    model.edges.forEach((edge: UMLEdge, index: number) => {
      const sourceId = this.findVisibleParent(edge.from, model)
      const targetId = this.findVisibleParent(edge.to, model)

      if (!sourceId || !targetId) return

      // Use FQNs for LCA calculation to correctly identify parent packages
      const sourcePath = this.getItemPath(sourceId, model)
      const targetPath = this.getItemPath(targetId, model)
      const lcaId = this.findLCA(sourcePath, targetPath)
      const isHierarchy = UMLScorer.isHierarchyEdge(edge.type)

      // In ELK, for hierarchical layout, reversing the edge direction
      // helps keep the "parent" (base class) above the "child".
      const source = isHierarchy ? targetId : sourceId
      const target = isHierarchy ? sourceId : targetId

      const weight = UMLScorer.getEdgeWeight(edge.type).toString()

      const elkEdge: ElkExtendedEdge = {
        id: `e${index}`,
        sources: [source],
        targets: [target],
        layoutOptions: {
          'elk.edge.weight': weight,
          'elk.edgeRouting': 'ORTHOGONAL',
        },
      }

      if (lcaId === 'root') {
        elkEdge.layoutOptions!['elk.edgeRouting'] = 'POLYLINE'
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
    })

    model.anchors?.forEach((anchor, index) => {
      anchor.to.forEach((originalTargetId, _targetIndex) => {
        const sourceId = this.findVisibleParent(anchor.from, model)
        const targetId = this.findVisibleParent(originalTargetId, model)

        if (!sourceId || !targetId) return

        const sourcePath = this.getItemPath(sourceId, model)
        const targetPath = this.getItemPath(targetId, model)
        const lcaId = this.findLCA(sourcePath, targetPath)
        const weight = UMLScorer.getEdgeWeight('anchor').toString()

        const elkEdge: ElkExtendedEdge = {
          id: `a${index}_${originalTargetId}`,
          sources: [sourceId],
          targets: [targetId],
          layoutOptions: {
            'elk.edge.weight': weight,
            'elk.edgeRouting': 'POLYLINE',
          },
        }

        if (!groups.has(lcaId)) groups.set(lcaId, [])
        groups.get(lcaId)!.push(elkEdge)
      })
    })

    return groups
  }

  private findLCA(path1: string, path2: string): string {
    const p1 = path1.split('.')
    const p2 = path2.split('.')
    const common: string[] = []

    // We only want to compare package segments, not the final name
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

  private applyLayout(model: DiagramModel, layoutedGraph: ElkNode): void {
    this.processElkNodes(layoutedGraph.children ?? [], model, 0, 0)
    this.processElkEdges(layoutedGraph, model, 0, 0)
  }

  private processElkNodes(
    elkNodes: ElkNode[],
    model: DiagramModel,
    offsetX: number,
    offsetY: number,
  ): void {
    for (const elkNode of elkNodes) {
      const node = model.nodes.find((n: UMLNode) => n.id === elkNode.id)
      if (node) {
        node.updateLayout(
          (elkNode.x || 0) + offsetX,
          (elkNode.y || 0) + offsetY,
          elkNode.width || 0,
          elkNode.height || 0,
        )
      } else {
        const note = (model.notes || []).find((n: UMLNote) => n.id === elkNode.id)
        if (note) {
          note.updateLayout(
            (elkNode.x || 0) + offsetX,
            (elkNode.y || 0) + offsetY,
            elkNode.width || 0,
            elkNode.height || 0,
          )
        }
      }
      if (elkNode.children) {
        const pkg = this.findPackage(model.packages, elkNode.id)
        if (pkg) {
          pkg.updateLayout(
            (elkNode.x || 0) + offsetX,
            (elkNode.y || 0) + offsetY,
            elkNode.width || 0,
            elkNode.height || 0,
          )
        }
        this.processElkNodes(
          elkNode.children,
          model,
          offsetX + (elkNode.x || 0),
          offsetY + (elkNode.y || 0),
        )
      }
    }
  }

  private processElkEdges(
    container: ElkNode,
    model: DiagramModel,
    offsetX: number,
    offsetY: number,
  ): void {
    if (container.edges) {
      for (const elkEdge of container.edges) {
        if (elkEdge.id.startsWith('e')) {
          const edgeIndex = parseInt(elkEdge.id.substring(1), 10)
          const edge = model.edges[edgeIndex]
          if (edge && elkEdge.sections && elkEdge.sections[0]) {
            const waypoints = this.extractWaypoints(elkEdge, offsetX, offsetY)
            const isHierarchy = UMLScorer.isHierarchyEdge(edge.type)
            if (isHierarchy) waypoints.reverse()

            const labelInfo = this.extractLabelInfo(elkEdge, offsetX, offsetY)
            edge.updateLayout(waypoints, labelInfo?.pos, labelInfo?.width, labelInfo?.height)
          }
        } else if (elkEdge.id.startsWith('a')) {
          const match = elkEdge.id.match(/^a(\d+)_(.+)$/)
          if (match) {
            const anchorIndex = parseInt(match[1], 10)
            const targetId = match[2]
            const anchor = model.anchors[anchorIndex]
            if (anchor && elkEdge.sections && elkEdge.sections[0]) {
              const waypoints = this.extractWaypoints(elkEdge, offsetX, offsetY)
              anchor.updateLayout(targetId, waypoints)
            }
          }
        }
      }
    }
    for (const child of container.children ?? []) {
      this.processElkEdges(child, model, offsetX + (child.x || 0), offsetY + (child.y || 0))
    }
  }

  private extractWaypoints(
    elkEdge: ElkExtendedEdge,
    offsetX: number,
    offsetY: number,
  ): Array<{ x: number; y: number }> {
    if (!elkEdge.sections || elkEdge.sections.length === 0) return []
    const section = elkEdge.sections[0]
    const waypoints = []

    if (section.startPoint) {
      waypoints.push({
        x: (section.startPoint.x || 0) + offsetX,
        y: (section.startPoint.y || 0) + offsetY,
      })
    }

    if (section.bendPoints) {
      for (const bp of section.bendPoints) {
        waypoints.push({
          x: (bp.x || 0) + offsetX,
          y: (bp.y || 0) + offsetY,
        })
      }
    }

    if (section.endPoint) {
      waypoints.push({
        x: (section.endPoint.x || 0) + offsetX,
        y: (section.endPoint.y || 0) + offsetY,
      })
    }

    return waypoints
  }

  private extractLabelInfo(
    elkEdge: ElkExtendedEdge,
    offsetX: number,
    offsetY: number,
  ): { pos: { x: number; y: number }; width?: number; height?: number } | undefined {
    if (elkEdge.labels && elkEdge.labels[0]) {
      const l = elkEdge.labels[0]
      return {
        pos: { x: (l.x || 0) + offsetX, y: (l.y || 0) + offsetY },
        width: l.width,
        height: l.height,
      }
    }
    return undefined
  }

  private findPackage(packages: UMLPackage[], id: string): UMLPackage | undefined {
    for (const pkg of packages) {
      if (pkg.id === id) return pkg
      const nested = pkg.children.filter(
        (c: UMLHierarchyItem): c is UMLPackage => c instanceof UMLPackage,
      )
      const found = this.findPackage(nested, id)
      if (found) return found
    }
    return undefined
  }

  /**
   * Resolves the full path of an item (namespace + id) for LCA calculation.
   */
  private getItemPath(id: string, model: DiagramModel): string {
    // 1. Exact or suffix match for nodes
    const node = model.nodes.find((n) => n.id === id || n.id.endsWith('.' + id))
    if (node) {
      if (node.id.includes('.') && node.namespace && node.id.startsWith(node.namespace))
        return node.id
      return node.namespace ? `${node.namespace}.${node.id}` : node.id
    }

    // 2. Exact or suffix match for notes
    const note = (model.notes || []).find((n) => n.id === id || n.id.endsWith('.' + id))
    if (note) {
      if (note.id.includes('.') && note.namespace && note.id.startsWith(note.namespace))
        return note.id
      return note.namespace ? `${note.namespace}.${note.id}` : note.id
    }

    const pkg = this.findPackage(model.packages, id)
    if (pkg) return pkg.id

    return id
  }

  private findVisibleParent(id: string, model: DiagramModel): string | undefined {
    const visibleIds = this.getFlatVisibleIds(model)

    // Direct match
    if (visibleIds.has(id)) return id

    // If it's an edge ID, use its 'from' node as the layout anchor
    const edge = model.edges.find((e) => e.id === id)
    if (edge) return this.findVisibleParent(edge.from, model)

    let currentId: string | undefined = id
    while (currentId) {
      if (visibleIds.has(currentId)) return currentId
      const lastDot = currentId.lastIndexOf('.')
      if (lastDot === -1) break
      currentId = currentId.substring(0, lastDot)
    }

    // Final fallback: suffix match (e.g. "PrimaryNode" matches "TestGroup.PrimaryNode")
    for (const vid of visibleIds) {
      if (vid.endsWith('.' + id)) return vid
    }

    return undefined
  }

  private getFlatVisibleIds(model: DiagramModel): Set<string> {
    const ids = new Set<string>()

    const traverse = (items: UMLHierarchyItem[]) => {
      for (const item of items) {
        ids.add(item.id)
        if (item instanceof UMLPackage) {
          traverse(item.children)
        }
      }
    }

    model.nodes.forEach((n) => ids.add(n.id))
    if (model.notes) model.notes.forEach((n) => ids.add(n.id))
    model.edges.forEach((e) => {
      if (e.id) ids.add(e.id)
    })
    traverse(model.packages)

    return ids
  }

  private calculateModelBoundingBox(model: DiagramModel) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    const MARGIN = 40 // Increased margin for safety

    const allVisualNodes: UMLHierarchyItem[] = [...model.nodes, ...(model.notes || [])]

    // Add packages to the bounding box calculation
    const traversePackages = (pkgs: UMLPackage[]) => {
      for (const pkg of pkgs) {
        allVisualNodes.push(pkg)
        traversePackages(pkg.children.filter((c): c is UMLPackage => c instanceof UMLPackage))
      }
    }
    traversePackages(model.packages)

    for (const node of allVisualNodes) {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x + node.width)
      maxY = Math.max(maxY, node.y + node.height)
    }
    for (const edge of model.edges) {
      if (edge.waypoints) {
        for (const wp of edge.waypoints) {
          minX = Math.min(minX, wp.x)
          minY = Math.min(minY, wp.y)
          maxX = Math.max(maxX, wp.x)
          maxY = Math.max(maxY, wp.y)
        }
      }
    }

    if (minX === Infinity) {
      return { x: 0, y: 0, width: 100, height: 100 }
    }

    return {
      x: minX - MARGIN,
      y: minY - MARGIN,
      width: maxX - minX + MARGIN * 2,
      height: maxY - minY + MARGIN * 2,
    }
  }
}
