import { type IRDiagram, type IREntity } from '@umlts/engine'
import {
  UMLPackage,
  UMLConstraintArc,
  UMLSpatialNode,
  type DiagramModel,
} from '../core/model/index'
import { IModelFactory } from '../core/model/factory/factory.interface'
import { ModelFactory } from '../core/model/factory'
import { type IDataProvider } from '../core/contract'
import { ConfigProcessor } from '../core/config-processor'

/**
 * IRAdapter: Transforms the Intermediate Representation (IR) from the engine
 * into a DiagramModel suitable for layout and rendering.
 */
export class IRAdapter implements IDataProvider<IRDiagram> {
  constructor(private readonly factory: IModelFactory = new ModelFactory()) {}

  public provide(source: IRDiagram): DiagramModel {
    const model = this.transform(source)
    return {
      ...model,
      config: ConfigProcessor.normalize(source.config),
    }
  }

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

    source.relationships.forEach((rel) => {
      trackVisible(rel.from)
      trackVisible(rel.to)
    })

    source.anchors?.forEach((anchor) => {
      trackVisible(anchor.from)
      anchor.to.forEach((targetId) => trackVisible(targetId))
    })

    const visibleEntities = source.entities.filter(
      (e: IREntity) => !hidden.has(e.id) || nodesWithEdges.has(e.id),
    )
    const visibleEntityIds = new Set(visibleEntities.map((e) => e.id))

    const nodes = visibleEntities.map((entity) => this.factory.createNode(entity))

    let rawRelationships = source.relationships
    if (source.config?.showDependencies === false) {
      rawRelationships = rawRelationships.filter((rel) => rel.type.toLowerCase() !== 'dependency')
    }

    const edgeOccurrenceMap = new Map<string, number>()

    const edges = rawRelationships
      .filter((rel) => visibleEntityIds.has(rel.from) && visibleEntityIds.has(rel.to))
      .map((rel) => {
        const semanticKey = `${rel.from}_${rel.to}_${rel.type}`
        const occurrence = (edgeOccurrenceMap.get(semanticKey) || 0) + 1
        edgeOccurrenceMap.set(semanticKey, occurrence)

        const stableId = `rel_${semanticKey}_${occurrence}`
        return this.factory.createEdge(rel, stableId)
      })

    const noteIdMap = new Map<string, string>()

    const notes = (source.notes || []).map((note, index) => {
      const uNote = this.factory.createNote(note)
      if (note.id) noteIdMap.set(note.id, uNote.id)
      else noteIdMap.set(`anon_${index}`, uNote.id)
      return uNote
    })

    const anchors = (source.anchors || []).map((anchor, index) => {
      const newFrom = noteIdMap.get(anchor.from) || anchor.from
      return this.factory.createAnchor(`anchor_${index}`, newFrom, anchor.to)
    })

    const constraints = (source.constraints || []).map((c) => {
      const arc = new UMLConstraintArc(`${c.kind}_${c.targets.join('_')}`, c.kind)
      arc.targets = [...c.targets]
      return arc
    })

    const packages = this.buildHierarchy([...nodes, ...notes])

    return {
      components: [...nodes, ...edges, ...packages, ...notes, ...anchors, ...constraints],
      nodes,
      edges,
      packages,
      notes,
      anchors,
      constraints,
      config: source.config ? ConfigProcessor.normalize(source.config) : {},
    }
  }

  private buildHierarchy(items: UMLSpatialNode[]): UMLPackage[] {
    const pkgMap = new Map<string, UMLPackage>()
    const rootPackages: UMLPackage[] = []

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
          const pkg = this.factory.createPackage(currentPath, part)
          pkgMap.set(currentPath, pkg)

          if (parentPath && pkgMap.has(parentPath)) {
            pkgMap.get(parentPath)!.children.push(pkg)
          } else if (i === 0) {
            rootPackages.push(pkg)
          }
        }
      }

      const leafPkg = pkgMap.get(namespace)
      if (leafPkg) {
        leafPkg.children.push(item)
      }
    }

    return rootPackages
  }
}
