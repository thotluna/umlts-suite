import { IRRelationship, IRRelationshipType } from '@umlts/engine'
import {
  UMLGeneralization,
  UMLRealization,
  UMLAssociation,
  UMLAggregation,
  UMLComposition,
  UMLDependency,
  UMLEdge,
} from '../../../index'
import { RelationshipMapper } from '../../mapper.interface'
import { MappingContext } from '../../context'

export class HierarchyMapper implements RelationshipMapper {
  public canMap(rel: IRRelationship): boolean {
    const type = rel.type
    return (
      type === IRRelationshipType.GENERALIZATION ||
      type === IRRelationshipType.INTERFACE_REALIZATION
    )
  }

  public map(rel: IRRelationship, context: MappingContext, id: string): UMLEdge {
    let edge: UMLEdge

    if (rel.type === IRRelationshipType.GENERALIZATION) {
      edge = new UMLGeneralization(id, rel.from, rel.to)
    } else {
      edge = new UMLRealization(id, rel.from, rel.to)
    }

    context.applyCommonEdgeMetadata(edge, rel)
    return edge
  }
}

export class StructuralMapper implements RelationshipMapper {
  public canMap(rel: IRRelationship): boolean {
    return (
      rel.type === IRRelationshipType.ASSOCIATION ||
      rel.type === IRRelationshipType.AGGREGATION ||
      rel.type === IRRelationshipType.COMPOSITION ||
      rel.type === IRRelationshipType.DEPENDENCY
    )
  }

  public map(rel: IRRelationship, context: MappingContext, id: string): UMLEdge {
    const creators: Record<string, () => UMLEdge> = {
      [IRRelationshipType.AGGREGATION]: () => new UMLAggregation(id, rel.from, rel.to),
      [IRRelationshipType.COMPOSITION]: () => new UMLComposition(id, rel.from, rel.to),
      [IRRelationshipType.DEPENDENCY]: () => new UMLDependency(id, rel.from, rel.to),
      [IRRelationshipType.ASSOCIATION]: () => {
        const assoc = new UMLAssociation(id, rel.from, rel.to)
        assoc.isNavigable = rel.isNavigable
        return assoc
      },
    }

    const creator = creators[rel.type as string] || creators[IRRelationshipType.ASSOCIATION]
    const edge = creator()

    context.applyCommonEdgeMetadata(edge, rel)
    return edge
  }
}
