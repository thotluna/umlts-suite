import {
  type DiagramModel,
  UMLSpatialNode,
  UMLEdge,
  UMLInterface,
  UMLGenericInterface,
} from '../core/model/index'

export interface NodeStats {
  score: number
}

/**
 * UMLScorer: Calculates priority scores and weights for UML elements
 * to influence graph layout algorithms.
 */
export class UMLScorer {
  /**
   * Calculates scores for nodes based on their type and relationships.
   */
  public static calculateNodeStats(model: DiagramModel): Map<string, NodeStats> {
    const stats = new Map<string, NodeStats>()

    model.nodes.forEach((n: UMLSpatialNode) => {
      let baseScore = 0
      if (n instanceof UMLInterface || n instanceof UMLGenericInterface) baseScore = 5
      if (n.isAbstract) baseScore += 2
      stats.set(n.id, { score: baseScore })
    })

    model.edges.forEach((edge: UMLEdge) => {
      const s = stats.get(edge.from)
      const t = stats.get(edge.to)
      if (!s || !t) return

      const type = edge.type.toLowerCase()

      // Hierarchy (Inheritance/Implementation) - Targets should be higher
      if (
        type.includes('inheritance') ||
        type.includes('generalization') ||
        type.includes('realization')
      ) {
        t.score += 20
        s.score -= 10
      } else if (type.includes('composition') || type.includes('aggregation')) {
        s.score += 15
        t.score -= 5
      } else {
        s.score += 2
        t.score -= 1
      }
    })

    return stats
  }

  /**
   * Returns a layout weight for an edge based on its UML type.
   */
  public static getEdgeWeight(edgeType: string): number {
    const type = edgeType.toLowerCase()
    if (
      type.includes('inheritance') ||
      type.includes('generalization') ||
      type.includes('realization')
    )
      return 10
    if (type.includes('composition')) return 7
    if (type.includes('aggregation')) return 5
    if (type.includes('association')) return 3
    if (type.includes('anchor')) return 1
    return 1
  }

  /**
   * Determines if an edge represents a hierarchy relationship.
   */
  public static isHierarchyEdge(edgeType: string): boolean {
    const type = edgeType.toLowerCase()
    return (
      type.includes('inheritance') ||
      type.includes('generalization') ||
      type.includes('realization')
    )
  }
}
