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
    const elkChildren: ElkNode[] = [
      ...topLevelNodes.map((n: UMLNode) => this.toElkNode(n, nodeStats.get(n.id)?.score)),
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

  private groupEdgesByLCA(
    model: DiagramModel,
    _layoutOptions: Record<string, string>,
  ): Map<string, ElkExtendedEdge[]> {
    const groups = new Map<string, ElkExtendedEdge[]>()

    model.edges.forEach((edge: UMLEdge, index: number) => {
      const lcaId = this.findLCA(edge.from, edge.to)
      const isHierarchy = UMLScorer.isHierarchyEdge(edge.type)

      // In ELK, for hierarchical layout, reversing the edge direction
      // helps keep the "parent" (base class) above the "child".
      const source = isHierarchy ? edge.to : edge.from
      const target = isHierarchy ? edge.from : edge.to

      const weight = UMLScorer.getEdgeWeight(edge.type).toString()

      const elkEdge: ElkExtendedEdge = {
        id: `e${index}`,
        sources: [source],
        targets: [target],
        layoutOptions: {
          'elk.edge.weight': weight,
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

    return groups
  }

  private findLCA(id1: string, id2: string): string {
    const p1 = id1.split('.')
    const p2 = id2.split('.')
    const common: string[] = []
    const len = Math.min(p1.length - 1, p2.length - 1)
    for (let i = 0; i < len; i++) {
      if (p1[i] === p2[i]) common.push(p1[i])
      else break
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
        if (!elkEdge.id.startsWith('e')) continue
        const edgeIndex = parseInt(elkEdge.id.substring(1), 10)
        const edge = model.edges[edgeIndex]
        if (edge && elkEdge.sections && elkEdge.sections[0]) {
          const section = elkEdge.sections[0]
          const waypoints = []
          waypoints.push({ x: section.startPoint.x + offsetX, y: section.startPoint.y + offsetY })
          if (section.bendPoints) {
            for (const bp of section.bendPoints) {
              waypoints.push({ x: bp.x + offsetX, y: bp.y + offsetY })
            }
          }
          waypoints.push({ x: section.endPoint.x + offsetX, y: section.endPoint.y + offsetY })

          const isHierarchy = UMLScorer.isHierarchyEdge(edge.type)
          if (isHierarchy) waypoints.reverse()

          let labelPos, labelWidth, labelHeight
          if (elkEdge.labels && elkEdge.labels[0]) {
            const l = elkEdge.labels[0]
            labelPos = { x: (l.x || 0) + offsetX, y: (l.y || 0) + offsetY }
            labelWidth = l.width
            labelHeight = l.height
          }
          edge.updateLayout(waypoints, labelPos, labelWidth, labelHeight)
        }
      }
    }
    for (const child of container.children ?? []) {
      this.processElkEdges(child, model, offsetX + (child.x || 0), offsetY + (child.y || 0))
    }
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

  private calculateModelBoundingBox(model: DiagramModel) {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    const MARGIN = 30
    for (const node of model.nodes) {
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
    return {
      x: minX - MARGIN,
      y: minY - MARGIN,
      width: maxX - minX + MARGIN * 2,
      height: maxY - minY + MARGIN * 2,
    }
  }
}
