import {
  IRRelationshipType,
  IRVisibility,
  type IRConstraint,
  type IRModifiers,
} from '../../generator/ir/models'
import { ASTNodeType, type Modifiers, type TypeNode } from '../../syntax/nodes'
import type { AnalysisSession } from '../session/analysis-session'
import type { RelationshipAnalyzer } from '../analyzers/relationship-analyzer'
import type { TypeResolutionPipeline } from './type-resolution.pipeline'
import { TypeValidator } from '../utils/type-validator'

/**
 * Infers relationships between entities based on their members (properties and operations).
 * Extracted from SemanticAnalyzer to decouple domain logic from orchestration.
 */
export class MemberInference {
  constructor(
    private readonly session: AnalysisSession,
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
    private readonly pipeline: TypeResolutionPipeline,
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
            undefined, // Multiplicity is an object now, resolved in Refiner
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
        // Return types
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

        // Parameters: only infer relationships when explicitly declared with a relationship kind
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
    // Helper to create AST node from string implementation
    const typeNodeLike = this.createTypeNode(typeName, line || 0, column || 0)

    // 1. Try to resolve via Pipeline (Plugins + Core strategies)
    const resolution = this.pipeline.resolve(typeNodeLike)

    const { baseName, values } = TypeValidator.decomposeEnum(typeName)

    if (resolution) {
      if (resolution.isIgnored) return

      const fromEntity = this.session.symbolTable.get(fromFQN)
      const finalToFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
        resolution.targetName,
        fromNamespace || '',
        targetModifiers || {},
        line,
        column,
        fromEntity
          ? {
              sourceType: fromEntity.type,
              relationshipKind: resolution.relationshipType || relType,
            }
          : undefined,
        fromEntity?.typeParameters,
        values.length > 0 ? values : undefined,
      )

      this.relationshipAnalyzer.addResolvedRelationship(
        fromFQN,
        finalToFQN,
        resolution.relationshipType || relType,
        {
          line,
          column,
          label: resolution.label,
          toName: explicitLabel || label,
          toMultiplicity: resolution.multiplicity || toMultiplicity,
          fromMultiplicity,
          visibility,
          associationClassId,
          constraints: memberConstraints,
        },
      )
      return
    }

    // 2. Fallback: Check if it is a primitive (UML or Language specific handled by pipeline)
    const isPrim = this.pipeline.isPrimitive(typeName)
    if (isPrim) {
      return
    }

    // 3. Fallback: Check internal generic parameters
    const fromEntity = this.session.symbolTable.get(fromFQN)
    if (fromEntity?.typeParameters?.includes(baseName)) return

    if (this.pipeline.isPrimitive(baseName)) return

    // Check if the resolved target is a Primitive or DataType in the SymbolTable
    const targetResolution = this.session.symbolTable.resolveFQN(baseName, fromNamespace)
    const knownTarget = this.session.symbolTable.get(targetResolution.fqn)
    if (knownTarget && (knownTarget.type === 'PrimitiveType' || knownTarget.type === 'DataType')) {
      return
    }

    // 4. Default: It's an implicit relationship to another entity
    const finalToFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      baseName,
      fromNamespace || '',
      targetModifiers || {},
      line,
      column,
      fromEntity ? { sourceType: fromEntity.type, relationshipKind: relType } : undefined,
      fromEntity?.typeParameters,
      values.length > 0 ? values : undefined,
    )

    this.relationshipAnalyzer.addResolvedRelationship(fromFQN, finalToFQN, relType, {
      line,
      column,
      label,
      toName: label,
      toMultiplicity,
      fromMultiplicity,
      visibility,
      associationClassId,
      constraints: memberConstraints,
    })
  }

  private createTypeNode(typeName: string, line: number, column: number): TypeNode {
    const { baseName, args, multiplicity } = TypeValidator.decomposeGeneric(typeName)
    const { values } = TypeValidator.decomposeEnum(typeName)

    if (multiplicity !== undefined) {
      return {
        type: ASTNodeType.TYPE,
        name: baseName,
        raw: typeName,
        kind: 'array',
        arguments: args.map((arg) => this.createTypeNode(arg, line, column)),
        values: values.length > 0 ? values : undefined,
        line,
        column,
      }
    }

    return {
      type: ASTNodeType.TYPE,
      name: baseName,
      raw: typeName,
      kind: values.length > 0 ? 'enum' : args.length > 0 ? 'generic' : 'simple',
      arguments: args.map((arg) => this.createTypeNode(arg, line, column)),
      values: values.length > 0 ? values : undefined,
      line,
      column,
    }
  }
}
