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
    const { baseName, args, multiplicity } = TypeValidator.decomposeGeneric(typeName)
    const { values: enumValues } = TypeValidator.decomposeEnum(typeName)

    const isBasePrimitive = this.session.typeResolver.isPrimitive(baseName)

    // Recursively process generic arguments FIRST
    // This ensures that for Record<string, User>, we find User even if Record is primitive
    if (args && args.length > 0) {
      args.forEach((arg) => {
        let argMultiplicity
        if (baseName === 'Array' || baseName === 'ReadonlyArray') {
          argMultiplicity = '*'
        } else if (baseName === 'xor' && (args.includes('null') || args.includes('undefined'))) {
          argMultiplicity = '0..1'
        }

        this.inferFromType(
          fromFQN,
          arg,
          fromNamespace,
          undefined, // Don't propagate label to generic args
          IRRelationshipType.ASSOCIATION,
          argMultiplicity || toMultiplicity,
          visibility,
          undefined,
          undefined,
          line,
          column,
          undefined,
          undefined,
          undefined,
        )
      })
    }

    // If the base name is primitive, we stop here for the base relationship
    if (isBasePrimitive) return

    const fromEntity = this.session.symbolTable.get(fromFQN)
    if (fromEntity?.typeParameters?.includes(baseName)) return

    // Multiplicity Inference (TS Specifics)
    let finalMultiplicity = multiplicity || toMultiplicity
    if (baseName === 'Array' || baseName === 'ReadonlyArray' || multiplicity === '') {
      finalMultiplicity = '*'
    } else if (baseName === 'xor' && (args?.includes('null') || args?.includes('undefined'))) {
      finalMultiplicity = '0..1'
    }

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
      toMultiplicity: finalMultiplicity,
      fromMultiplicity,
      visibility,
      associationClassId,
      constraints: memberConstraints,
    })
  }
}
