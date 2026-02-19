import { IRRelationshipType, IRVisibility, type IRConstraint } from '../../generator/ir/models'
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

      // 2. Inference from Operations (Return types)
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
    targetModifiers?: Modifiers,
    memberConstraints?: IRConstraint[],
    explicitLabel?: string,
  ): void {
    // Helper to create AST node from string implementation
    const typeNodeLike = this.createTypeNode(typeName, line || 0, column || 0)

    // 1. Try to resolve via Pipeline (Plugins + Core strategies)
    const resolution = this.pipeline.resolve(typeNodeLike)

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
    if (this.pipeline.isPrimitive(typeName)) return

    // 3. Fallback: Check internal generic parameters
    const fromEntity = this.session.symbolTable.get(fromFQN)
    const baseType = TypeValidator.getBaseTypeName(typeName)
    if (fromEntity?.typeParameters?.includes(baseType)) return

    if (this.pipeline.isPrimitive(baseType)) return

    // 4. Default: It's an implicit relationship to another entity
    const finalToFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      baseType,
      fromNamespace || '',
      targetModifiers || {},
      line,
      column,
      fromEntity ? { sourceType: fromEntity.type, relationshipKind: relType } : undefined,
      fromEntity?.typeParameters,
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
    const { baseName, args } = TypeValidator.decomposeGeneric(typeName)
    return {
      type: ASTNodeType.TYPE,
      name: baseName,
      raw: typeName,
      kind: args.length > 0 ? 'generic' : 'simple',
      arguments: args.map((arg) => this.createTypeNode(arg, line, column)),
      line,
      column,
    }
  }
}
