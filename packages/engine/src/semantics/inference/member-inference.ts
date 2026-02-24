import {
  IRRelationshipType,
  IRVisibility,
  type IRConstraint,
  type IRModifiers,
} from '@engine/generator/ir/models'
import { type Modifiers } from '@engine/syntax/nodes'
import type { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'
import { TypeValidator } from '@engine/semantics/utils/type-validator'

/**
 * Infers relationships between entities based on their members (properties and operations).
 */
export class MemberInference {
  constructor(
    private readonly session: ISemanticState,
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
  ) {}

  /**
   * Main entry point. Iterates over all discovered entities and infers relationships
   * from their properties and operation return types.
   */
  public run(): void {
    const entities = this.session.symbolTable.getAllEntities()
    entities.forEach((entity) => {
      // 1. Inference from Properties (Attributes)
      ;(entity.properties || []).forEach((prop) => {
        if (prop.type) {
          let relType = IRRelationshipType.ASSOCIATION
          if (prop.aggregation === 'shared') relType = IRRelationshipType.AGGREGATION
          if (prop.aggregation === 'composite') relType = IRRelationshipType.COMPOSITION

          this.inferFromType(
            entity.id,
            prop.type,
            entity.namespace,
            prop.name,
            relType,
            undefined,
            prop.visibility,
            undefined,
            undefined,
            prop.line,
            prop.column,
            undefined,
            prop.constraints,
            prop.label,
          )
        }
      })

      // 2. Inference from Operations (Return types and Parameters)
      ;(entity.operations || []).forEach((op) => {
        if (op.returnType) {
          this.inferFromType(
            entity.id,
            op.returnType,
            entity.namespace,
            undefined,
            IRRelationshipType.ASSOCIATION,
            undefined,
            op.visibility,
            undefined,
            undefined,
            op.line,
            op.column,
            undefined,
            op.constraints,
          )
        }

        ;(op.parameters || []).forEach((p) => {
          if (p.type && p.relationshipKind) {
            this.inferFromType(
              entity.id,
              p.type,
              entity.namespace,
              p.name,
              this.relationshipAnalyzer.mapRelationshipType(p.relationshipKind),
              undefined,
              op.visibility,
              undefined,
              undefined,
              p.line || op.line,
              p.column || op.column,
              p.modifiers,
              undefined,
            )
          }
        })
      })
    })
  }

  private inferFromType(
    fromFQN: string,
    typeName: string,
    fromNamespace?: string,
    label?: string,
    relType: IRRelationshipType = IRRelationshipType.ASSOCIATION,
    toMultiplicity?: string,
    visibility?: IRVisibility,
    fromMultiplicity?: string,
    associationClassId?: string,
    line?: number,
    column?: number,
    targetModifiers?: Modifiers | IRModifiers,
    memberConstraints?: IRConstraint[],
    explicitLabel?: string,
  ): void {
    const { baseName, multiplicity } = TypeValidator.decomposeGeneric(typeName)
    const { values: enumValues } = TypeValidator.decomposeEnum(typeName)

    if (TypeValidator.isPrimitive(baseName)) return

    const fromEntity = this.session.symbolTable.get(fromFQN)
    if (fromEntity?.typeParameters?.includes(baseName)) return

    // Resolve target
    const finalToFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      baseName,
      fromNamespace || '',
      targetModifiers || {},
      line,
      column,
      fromEntity ? { sourceType: fromEntity.type, relationshipKind: relType } : undefined,
      fromEntity?.typeParameters,
      enumValues.length > 0 ? enumValues : undefined,
    )

    this.relationshipAnalyzer.addResolvedRelationship(fromFQN, finalToFQN, relType, {
      line,
      column,
      label: explicitLabel || label,
      toName: label,
      toMultiplicity: multiplicity || toMultiplicity,
      fromMultiplicity,
      visibility,
      associationClassId,
      constraints: memberConstraints,
    })
  }
}
