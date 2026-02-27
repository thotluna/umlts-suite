import { IREntity, IRRelationship, IRNote } from '@umlts/engine'
import { UMLNote, UMLText, UMLPackage, type UMLNode, UMLEdge, UMLAnchor } from './index'
import { MappingContext } from './factory/context'
import { EntityMapper, RelationshipMapper } from './factory/mapper.interface'
import { ClassMapper } from './factory/mappers/nodes/class-mapper'
import { InterfaceMapper } from './factory/mappers/nodes/interface-mapper'
import { EnumMapper, DataTypeMapper } from './factory/mappers/nodes/simple-types-mapper'
import { HierarchyMapper, StructuralMapper } from './factory/mappers/edges/relationship-mappers'
import { IModelFactory } from './factory/factory.interface'

/**
 * ModelFactory: Orchestrates mapping from IR to Domain Model using Mappers Registry.
 * Now implementes IModelFactory for Dependency Injection.
 */
export class ModelFactory implements IModelFactory {
  private readonly nodeMappers: EntityMapper[] = [
    new ClassMapper(),
    new InterfaceMapper(),
    new EnumMapper(),
    new DataTypeMapper(),
  ]

  private readonly edgeMappers: RelationshipMapper[] = [
    new HierarchyMapper(),
    new StructuralMapper(),
  ]

  private readonly context = new MappingContext()

  /**
   * Transforms an IREntity into a concrete UMLNode.
   */
  public createNode(entity: IREntity): UMLNode {
    const mapper = this.nodeMappers.find((m) => m.canMap(entity))
    if (!mapper) {
      return new ClassMapper().map(entity, this.context)
    }
    return mapper.map(entity, this.context)
  }

  /**
   * Transforms an IRRelationship into a concrete UMLEdge or Connector.
   */
  public createEdge(rel: IRRelationship, id?: string): UMLEdge {
    const finalId = id || `rel_${rel.from}_${rel.to}_${rel.type}`
    const mapper = this.edgeMappers.find((m) => m.canMap(rel))
    if (!mapper) {
      return new StructuralMapper().map(rel, this.context, finalId) as UMLEdge
    }

    return mapper.map(rel, this.context, finalId) as UMLEdge
  }

  /**
   * Creates a UMLNote from IR.
   */
  public createNote(irNote: IRNote): UMLNote {
    const note = new UMLNote(irNote.id)
    note.content = new UMLText(`${irNote.id}_content`, irNote.text)
    return note
  }

  /**
   * Creates a UMLPackage.
   */
  public createPackage(id: string, name: string): UMLPackage {
    return new UMLPackage(id, name)
  }

  /**
   * Creates a visual anchor.
   */
  public createAnchor(id: string, fromId: string, toIds: string[]): UMLAnchor {
    return new UMLAnchor(id, fromId, toIds)
  }
}
