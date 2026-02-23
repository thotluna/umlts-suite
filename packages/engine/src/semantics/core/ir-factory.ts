import {
  IREntityType,
  IRRelationshipType,
  type IREntity,
  type IRRelationship,
} from '@engine/generator/ir/models'

/**
 * Factory for creating Intermediate Representation (IR) models.
 * Centralizes the creation logic to ensure all required fields are
 * properly initialized according to the updated UML 2.5.1 strict typings.
 */
export class IRFactory {
  public static createEntity(
    id: string,
    name: string,
    type: IREntityType = IREntityType.CLASS,
    isImplicit = false,
  ): IREntity {
    return {
      id,
      name,
      type,
      properties: [],
      operations: [],
      isImplicit,
      isAbstract: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
      isStatic: false,
    }
  }

  public static createRelationship(
    from: string,
    to: string,
    type: IRRelationshipType = IRRelationshipType.ASSOCIATION,
    isNavigable = true,
  ): IRRelationship {
    return {
      from,
      to,
      type,
      isNavigable,
    }
  }
}
