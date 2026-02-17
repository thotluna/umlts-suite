import {
  type IR,
  type IREntity,
  type IRRelationship,
  UMLNode,
  UMLEdge,
  UMLPackage,
  type DiagramModel,
  type IRRelType,
} from '../core/types'

/**
 * IRAdapter: Transforms the raw IR from ts-uml-engine into a DiagramModel
 * suitable for layout and rendering.
 */
export class IRAdapter {
  /**
   * Transforms raw IR from context into a DiagramModel.
   */
  public transform(ir: IR): DiagramModel {
    const nodes = ir.entities.map((entity) => this.transformEntity(entity))
    const edges = ir.relationships.map((rel) => this.transformRelationship(rel))
    const packages = this.buildPackageHierarchy(nodes)

    return {
      nodes,
      edges,
      packages,
      constraints: ir.constraints || [],
    }
  }

  /**
   * Transforms a single entity into a UMLNode.
   */
  private transformEntity(entity: IREntity): UMLNode {
    const attributes = entity.members.filter((m) => m.parameters == null)
    const methods = entity.members.filter((m) => !(m.parameters == null))

    return new UMLNode(
      entity.id,
      entity.name,
      entity.type,
      attributes,
      methods,
      entity.isImplicit,
      entity.isAbstract,
      entity.isStatic,
      entity.isActive,
      entity.isLeaf || false,
      entity.isFinal || false,
      entity.isRoot || false,
      entity.typeParameters ?? [],
      entity.namespace,
      entity.docs,
    )
  }

  /**
   * Transforms a relationship into a UMLEdge.
   */
  private transformRelationship(rel: IRRelationship): UMLEdge {
    // Normalize relationship type to PascalCase
    const type = (rel.type.charAt(0).toUpperCase() + rel.type.slice(1).toLowerCase()) as IRRelType

    return new UMLEdge(
      rel.from,
      rel.to,
      type,
      rel.label,
      rel.visibility,
      rel.fromMultiplicity,
      rel.toMultiplicity,
      rel.associationClassId,
      rel.constraints,
    )
  }

  /**
   * Builds the tree structure of packages from nodes namespaces.
   */
  private buildPackageHierarchy(nodes: UMLNode[]): UMLPackage[] {
    const rootPackages = new Map<string, UMLPackage>()
    const allPackages = new Map<string, UMLPackage>()

    for (const node of nodes) {
      if (!node.namespace) continue

      const parts = this.splitNamespace(node.namespace)
      let currentPath = ''
      let parentPkg: UMLPackage | null = null

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}.${part}` : part
        let pkg = allPackages.get(currentPath)

        if (pkg == null) {
          pkg = new UMLPackage(part, [], currentPath)
          allPackages.set(currentPath, pkg)

          if (parentPkg != null) {
            parentPkg.children.push(pkg)
          } else {
            rootPackages.set(part, pkg)
          }
        }
        parentPkg = pkg
      }

      if (parentPkg != null) {
        parentPkg.children.push(node)
      }
    }

    return Array.from(rootPackages.values())
  }

  private splitNamespace(ns: string): string[] {
    const parts: string[] = []
    let current = ''
    let depth = 0

    for (let i = 0; i < ns.length; i++) {
      if (ns[i] === '<') depth++
      else if (ns[i] === '>') depth--

      if (ns[i] === '.' && depth === 0) {
        if (current) parts.push(current)
        current = ''
      } else {
        current += ns[i]
      }
    }
    if (current) parts.push(current)
    return parts
  }
}
