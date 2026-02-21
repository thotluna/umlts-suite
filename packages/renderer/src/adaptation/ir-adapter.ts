import { type IRDiagram, type IREntity, type IRRelationship } from '@umlts/engine'
import {
  UMLNode,
  UMLEdge,
  UMLPackage,
  type DiagramModel,
  type IRRelType,
} from '../core/model/nodes'

/**
 * IRAdapter: Transforms the raw IR from ts-uml-engine into a DiagramModel
 * suitable for layout and rendering.
 */
export class IRAdapter {
  /**
   * Transforms the entire diagram IR into a hierarchical model.
   */
  public transform(ir: IRDiagram): DiagramModel {
    const nodes: UMLNode[] = ir.entities.map((entity: IREntity) => this.transformEntity(entity))
    const edges: UMLEdge[] = ir.relationships.map((rel: IRRelationship) =>
      this.transformRelationship(rel),
    )

    // Build the package/namespace hierarchy
    const packages = this.buildHierarchy(nodes)

    return {
      nodes: nodes.filter((n: UMLNode) => !n.namespace), // Only top-level nodes
      edges,
      packages,
      constraints: ir.constraints || [],
    }
  }

  private transformEntity(entity: IREntity): UMLNode {
    return new UMLNode(
      entity.id,
      entity.name,
      entity.type,
      entity.properties,
      entity.operations,
      entity.isImplicit,
      entity.isAbstract,
      entity.isStatic,
      entity.isActive,
      entity.isLeaf,
      entity.typeParameters || [],
      entity.namespace,
      entity.docs,
    )
  }

  private transformRelationship(rel: IRRelationship): UMLEdge {
    return new UMLEdge(
      rel.from,
      rel.to,
      rel.type as IRRelType,
      rel.label,
      rel.visibility,
      rel.fromMultiplicity,
      rel.toMultiplicity,
      rel.associationClassId,
      rel.constraints,
    )
  }

  /**
   * Groups nodes into their respective packages based on the 'namespace' field (FQN).
   */
  private buildHierarchy(nodes: UMLNode[]): UMLPackage[] {
    const pkgMap = new Map<string, UMLPackage>()
    const rootPackages: UMLPackage[] = []

    // 1. Create all packages mentioned in namespaces
    for (const node of nodes) {
      if (!node.namespace) continue

      const parts = node.namespace.split('.')
      let currentPath = ''

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const parentPath = currentPath
        currentPath = currentPath ? `${currentPath}.${part}` : part

        if (!pkgMap.has(currentPath)) {
          const pkg = new UMLPackage(part, [], currentPath)
          pkgMap.set(currentPath, pkg)

          if (parentPath && pkgMap.has(parentPath)) {
            pkgMap.get(parentPath)!.children.push(pkg)
          } else if (i === 0) {
            rootPackages.push(pkg)
          }
        }
      }

      // Add node to its final package
      pkgMap.get(node.namespace)!.children.push(node)
    }

    return rootPackages
  }
}
