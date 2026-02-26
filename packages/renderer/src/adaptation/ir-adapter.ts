import { type IRRelationshipType, type IREntity, type IRMultiplicity } from '@engine/generator/ir/models'
import {
  UMLNode,
  UMLEdge,
  UMLPackage,
  type DiagramModel,
  type IRRelType,
} from '../core/model/nodes'
import { type IDataProvider } from '../core/contract'
import { ConfigProcessor } from '../core/config-processor'

/**
 * IRAdapter: Transforms the Intermediate Representation (IR) from the engine
 * into a DiagramModel suitable for layout and rendering.
 */
export class IRAdapter implements IDataProvider<IRDiagram> {
  /**
   * Transforms the IR source into a DiagramModel.
   */
  public provide(source: IRDiagram): DiagramModel {
    const model = this.transform(source)
    return {
      ...model,
      config: ConfigProcessor.normalize(source.config),
    }
  }

  /**
   * Transforms the entire diagram IR into a hierarchical model.
   */
  public transform(source: IRDiagram): DiagramModel {
    const hidden = new Set((source.config?.hiddenEntities as string[]) || [])
    const nodesWithEdges = new Set<string>()

    // Find all nodes that participate in relationships
    source.relationships.forEach((rel: IRRelationship) => {
      nodesWithEdges.add(rel.from)
      nodesWithEdges.add(rel.to)
    })

    // Filter entities: keep if not hidden OR if they have relationships
    const visibleEntities = source.entities.filter(
      (e: IREntity) => !hidden.has(e.id) || nodesWithEdges.has(e.id),
    )
    const visibleEntityIds = new Set(visibleEntities.map((e: IREntity) => e.id))

    const nodes: UMLNode[] = visibleEntities.map((entity: IREntity) => this.transformEntity(entity))

    // 2. Relationship Transformation & Filtering
    let rawRelationships = source.relationships

    // Apply showDependencies filter if defined in config
    if (source.config?.showDependencies === false) {
      rawRelationships = rawRelationships.filter(
        (rel: IRRelationship) => (rel.type as string).toLowerCase() !== 'dependency',
      )
    }

    const edges: UMLEdge[] = rawRelationships
      .filter(
        (rel: IRRelationship) => visibleEntityIds.has(rel.from) && visibleEntityIds.has(rel.to),
      )
      .map((rel: IRRelationship) => this.transformRelationship(rel))

    // Build the package/namespace hierarchy
    const packages = this.buildHierarchy(nodes)

    return {
      nodes,
      edges,
      packages,
      constraints: (source as any).constraints || [],
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
      rel.isNavigable,
      rel.constraints,
      rel.notes,
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

// Temporal interface extension for the adapter to avoid lint errors on source.constraints
interface IRDiagram {
  entities: IREntity[]
  relationships: any[]
  constraints: any[]
  config?: Record<string, any>
}
