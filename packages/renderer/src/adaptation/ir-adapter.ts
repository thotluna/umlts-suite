import {
  type IRDiagram,
  type IREntity,
  type IRRelationship,
  type IRNote,
  type IRAnchor,
} from '@umlts/engine'
import {
  UMLNode,
  UMLEdge,
  UMLPackage,
  UMLNote,
  UMLAnchor,
  UMLProperty,
  UMLOperation,
  type UMLHierarchyItem,
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

    const trackVisible = (id: string) => {
      let current = id
      while (current) {
        nodesWithEdges.add(current)
        const dot = current.lastIndexOf('.')
        if (dot === -1) break
        current = current.substring(0, dot)
      }
    }

    // Find all nodes that participate in relationships or anchors
    source.relationships.forEach((rel: IRRelationship) => {
      trackVisible(rel.from)
      trackVisible(rel.to)
    })

    source.anchors?.forEach((anchor: IRAnchor) => {
      trackVisible(anchor.from)
      anchor.to.forEach((targetId) => trackVisible(targetId))
    })

    // Filter entities: keep if not hidden OR if they have relationships
    const visibleEntities = source.entities.filter(
      (e: IREntity) => !hidden.has(e.id) || nodesWithEdges.has(e.id),
    )
    const visibleEntityIds = new Set(visibleEntities.map((e: IREntity) => e.id))

    const nodes: UMLNode[] = visibleEntities.map((entity: IREntity) =>
      this.transformEntity(entity, source),
    )

    // 2. Relationship Transformation & Filtering
    let rawRelationships = source.relationships

    // Apply showDependencies filter if defined in config
    if (source.config?.showDependencies === false) {
      rawRelationships = rawRelationships.filter(
        (rel: IRRelationship) => rel.type.toLowerCase() !== 'dependency',
      )
    }

    const edges: UMLEdge[] = rawRelationships
      .filter(
        (rel: IRRelationship) => visibleEntityIds.has(rel.from) && visibleEntityIds.has(rel.to),
      )
      .map((rel: IRRelationship) => this.transformRelationship(rel))

    // Deduplicate notes by ID or text to prevent multiple renderings
    const uniqueSourceNotes = (source.notes || []).filter(
      (note, index, self) =>
        index ===
        self.findIndex((n) => (n.id && n.id === note.id) || (!n.id && n.text === note.text)),
    )

    const noteIdMap = new Map<string, string>()
    const usedIds = new Set<string>()

    const notes: UMLNote[] = uniqueSourceNotes.map((note: IRNote, index: number) => {
      let uniqueId = note.id || `note_${index}`
      if (usedIds.has(uniqueId)) {
        uniqueId = `${uniqueId}_${index}`
      }
      usedIds.add(uniqueId)
      if (note.id) noteIdMap.set(note.id, uniqueId)
      noteIdMap.set(`anon_${index}`, uniqueId)

      let ns = note.namespace
      if (!ns) {
        const anchors = (source.anchors || []).filter(
          (a) => a.from === (note.id || `anon_${index}`),
        )
        const targets = anchors.flatMap((a) => a.to)
        if (targets.length > 0) {
          const targetNamespaces = targets
            .map((t) => {
              const entity = source.entities.find((e) => t === e.id || t.startsWith(e.id + '.'))
              return entity?.namespace
            })
            .filter((n): n is string => !!n)

          if (
            targetNamespaces.length > 0 &&
            targetNamespaces.length === targets.length &&
            targetNamespaces.every((n) => n === targetNamespaces[0])
          ) {
            ns = targetNamespaces[0]
          }
        }
      }
      return this.transformNote({ ...note, id: uniqueId, namespace: ns })
    })

    const anchors: UMLAnchor[] = (source.anchors || [])
      .filter(
        (a, i, self) =>
          i ===
          self.findIndex((x) => x.from === a.from && JSON.stringify(x.to) === JSON.stringify(a.to)),
      )
      .map((anchor: IRAnchor) => {
        const newFrom = noteIdMap.get(anchor.from) || anchor.from
        return new UMLAnchor(newFrom, anchor.to)
      })

    // Build the package/namespace hierarchy with both nodes and notes
    const packages = this.buildHierarchy([...nodes, ...notes])

    return {
      nodes,
      edges,
      packages,
      notes,
      anchors,
      constraints: source.constraints || [],
    }
  }

  private transformEntity(entity: IREntity, source: IRDiagram): UMLNode {
    const properties: UMLProperty[] = entity.properties.map((prop) => {
      // Check if this property is also represented as a relationship edge
      const hasRelationship = source.relationships.some(
        (rel) =>
          rel.from === entity.id &&
          (rel.label === prop.name || (rel.to === prop.type && !rel.label)),
      )

      if (hasRelationship || prop.aggregation !== 'none') {
        return { ...prop, hideConstraints: true }
      }
      return prop
    })

    const operations: UMLOperation[] = entity.operations.map((op) => {
      const hasRelationship = source.relationships.some(
        (rel) => rel.from === entity.id && rel.label === op.name,
      )

      if (hasRelationship) {
        return { ...op, hideConstraints: true }
      }
      return op
    })

    return new UMLNode(
      entity.id,
      entity.name,
      entity.type,
      properties.map((p) => {
        const hasMatchingNote = (source.notes || []).some((n) => {
          const isAnchored = source.anchors?.some(
            (a) => a.from === n.id && a.to.includes(`${entity.id}.${p.name}`),
          )
          return isAnchored && p.constraints?.some((c) => n.text.includes(c.kind))
        })
        return hasMatchingNote ? { ...p, hideConstraints: true } : p
      }),
      operations.map((o) => {
        const hasMatchingNote = (source.notes || []).some((n) => {
          const isAnchored = source.anchors?.some(
            (a) => a.from === n.id && a.to.includes(`${entity.id}.${o.name}`),
          )
          return isAnchored && o.constraints?.some((c) => n.text.includes(c.kind))
        })
        return hasMatchingNote ? { ...o, hideConstraints: true } : o
      }),
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
    const id = `${rel.from}-${rel.to}-${rel.type}`
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
      id,
    )
  }

  private transformNote(note: IRNote): UMLNote {
    return new UMLNote(note.id, note.text, note.namespace)
  }

  private transformAnchor(anchor: IRAnchor): UMLAnchor {
    return new UMLAnchor(anchor.from, anchor.to)
  }

  /**
   * Groups items into their respective packages based on the 'namespace' field (FQN).
   */
  private buildHierarchy(items: UMLHierarchyItem[]): UMLPackage[] {
    const pkgMap = new Map<string, UMLPackage>()
    const rootPackages: UMLPackage[] = []

    // 1. Create all packages mentioned in namespaces
    for (const item of items) {
      const namespace = item.namespace
      if (!namespace) continue

      const parts = namespace.split('.')
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

      // Add item to its final package
      pkgMap.get(namespace)!.children.push(item)
    }

    return rootPackages
  }
}
