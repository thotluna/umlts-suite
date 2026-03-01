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
    return rel.type === IRRelationshipType.ASSOCIATION || rel.type === IRRelationshipType.DEPENDENCY
  }

  public map(rel: IRRelationship, context: MappingContext, id: string): UMLEdge {
    let edge: UMLEdge

    if (rel.type === IRRelationshipType.DEPENDENCY) {
      edge = new UMLDependency(id, rel.from, rel.to)
    } else {
      if (rel.aggregation === 'composite') {
        edge = new UMLComposition(id, rel.from, rel.to)
      } else if (rel.aggregation === 'shared') {
        edge = new UMLAggregation(id, rel.from, rel.to)
      } else {
        const assoc = new UMLAssociation(id, rel.from, rel.to)
        assoc.isNavigable = rel.isNavigable
        edge = assoc
      }
    }

    context.applyCommonEdgeMetadata(edge, rel)
    return edge
  }
}
