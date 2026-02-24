import { EntityAnalyzer } from '@engine/semantics/analyzers/entity-analyzer'
import { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import { ConstraintAnalyzer } from '@engine/semantics/analyzers/constraint-analyzer'
import { HierarchyValidator } from '@engine/semantics/validators/hierarchy-validator'
import { ValidationEngine } from '@engine/semantics/core/validation-engine'
import { AssociationClassResolver } from '@engine/semantics/resolvers/association-class.resolver'
import { MemberInference } from '@engine/semantics/inference/member-inference'
import type { TypeResolutionPipeline } from '@engine/semantics/inference/type-resolution.pipeline'
import type { AnalysisSession } from '@engine/semantics/session/analysis-session'

export class SemanticServicesFactory {
  constructor(private readonly session: AnalysisSession) {}

  public createConstraintAnalyzer(): ConstraintAnalyzer {
    return new ConstraintAnalyzer(this.session.symbolTable, this.session.context)
  }

  public createHierarchyValidator(): HierarchyValidator {
    return new HierarchyValidator(this.session.symbolTable, this.session.context)
  }

  public createValidationEngine(): ValidationEngine {
    return new ValidationEngine()
  }

  public createEntityAnalyzer(constraintAnalyzer: ConstraintAnalyzer): EntityAnalyzer {
    return new EntityAnalyzer(
      this.session.symbolTable,
      constraintAnalyzer,
      this.session.context,
      this.session.configStore,
      this.session.pluginManager,
    )
  }

  public createRelationshipAnalyzer(hierarchyValidator: HierarchyValidator): RelationshipAnalyzer {
    return new RelationshipAnalyzer(
      this.session.symbolTable,
      this.session.relationships,
      hierarchyValidator,
      this.session.context,
    )
  }

  public createAssociationClassResolver(
    relationshipAnalyzer: RelationshipAnalyzer,
  ): AssociationClassResolver {
    return new AssociationClassResolver(this.session, relationshipAnalyzer, [])
  }

  public createMemberInference(
    relationshipAnalyzer: RelationshipAnalyzer,
    typePipeline: TypeResolutionPipeline,
  ): MemberInference {
    return new MemberInference(this.session, relationshipAnalyzer, typePipeline)
  }
}
