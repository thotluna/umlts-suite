import { IREntity, IRRelationship } from '@umlts/engine'
import { UMLNode, UMLEdge, UMLAnchor, UMLConstraintArc } from '../index'
import { MappingContext } from './context'

/**
 * Interface for specialized node mappers.
 */
export interface EntityMapper {
  canMap(entity: IREntity): boolean
  map(entity: IREntity, context: MappingContext): UMLNode
}

/**
 * Interface for specialized relationship mappers.
 */
export interface RelationshipMapper {
  canMap(rel: IRRelationship): boolean
  map(
    rel: IRRelationship,
    context: MappingContext,
    id: string,
  ): UMLEdge | UMLAnchor | UMLConstraintArc
}
