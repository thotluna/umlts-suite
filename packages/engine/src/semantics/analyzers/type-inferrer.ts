import { IREntityType, IRRelationshipType } from '@engine/generator/ir/models'

/**
 * Responsible for inferring the type of an implicit target entity based on the source entity type and the relationship.
 */
export class TypeInferrer {
  private rules = new Map<string, IREntityType>()

  /**
   * Registers a rule for type inference.
   * @param sourceType The type of the source entity.
   * @param relationshipType The type of relationship.
   * @param targetType The inferred type for the target entity.
   */
  public register(
    sourceType: IREntityType,
    relationshipType: IRRelationshipType,
    targetType: IREntityType,
  ): void {
    const key = this.getKey(sourceType, relationshipType)
    this.rules.set(key, targetType)
  }

  /**
   * Infers the target entity type.
   * @param sourceType The type of the source entity.
   * @param relationshipType The type of relationship.
   * @returns The inferred target type, or IREntityType.CLASS as a default fallback.
   */
  public infer(
    sourceType: IREntityType,
    relationshipType: IRRelationshipType,
  ): IREntityType | undefined {
    const key = this.getKey(sourceType, relationshipType)
    return this.rules.get(key)
  }

  private getKey(source: IREntityType, relationship: IRRelationshipType): string {
    return `${source}:${relationship}`
  }
}
