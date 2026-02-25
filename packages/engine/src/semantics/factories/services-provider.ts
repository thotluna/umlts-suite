import { EntityAnalyzer } from '@engine/semantics/analyzers/entity-analyzer'
import { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import { ConstraintAnalyzer } from '@engine/semantics/analyzers/constraint-analyzer'
import { HierarchyValidator } from '@engine/semantics/validators/hierarchy-validator'
import { ValidationEngine } from '@engine/semantics/core/validation-engine'
import { AssociationClassResolver } from '@engine/semantics/resolvers/association-class.resolver'
import { MemberInference } from '@engine/semantics/inference/member-inference'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'
import { UMLRuleProvider } from './rule-provider'

/**
 * Provider for semantic analysis services.
 * Orchestrates the creation and dependency injection of specialized analyzers.
 */
export class SemanticServicesProvider {
  private _constraintAnalyzer?: ConstraintAnalyzer
  private _entityAnalyzer?: EntityAnalyzer
  private _relationshipAnalyzer?: RelationshipAnalyzer
  private _hierarchyValidator?: HierarchyValidator
  private _validationEngine?: ValidationEngine
  private _assocClassResolver?: AssociationClassResolver
  private _memberInference?: MemberInference

  constructor(private readonly state: ISemanticState) {}

  public getConstraintAnalyzer(): ConstraintAnalyzer {
    return (this._constraintAnalyzer ??= new ConstraintAnalyzer(
      this.state.symbolTable,
      this.state.context,
    ))
  }

  public getHierarchyValidator(): HierarchyValidator {
    return (this._hierarchyValidator ??= new HierarchyValidator(
      this.state.symbolTable,
      this.state.context,
    ))
  }

  public getValidationEngine(): ValidationEngine {
    if (!this._validationEngine) {
      this._validationEngine = new ValidationEngine()
      UMLRuleProvider.registerDefaultRules(this._validationEngine, this.state.symbolTable)
    }
    return this._validationEngine
  }

  public getEntityAnalyzer(): EntityAnalyzer {
    return (this._entityAnalyzer ??= new EntityAnalyzer(
      this.state.symbolTable,
      this.getConstraintAnalyzer(),
      this.state.context,
      this.state.configStore,
      this.state.typeResolver,
    ))
  }

  public getRelationshipAnalyzer(): RelationshipAnalyzer {
    return (this._relationshipAnalyzer ??= new RelationshipAnalyzer(
      this.state.symbolTable,
      this.state.relationships,
      this.getHierarchyValidator(),
      this.state.typeResolver,
      this.state.context,
    ))
  }

  public getAssociationClassResolver(): AssociationClassResolver {
    return (this._assocClassResolver ??= new AssociationClassResolver(
      this.state,
      this.getRelationshipAnalyzer(),
      [],
    ))
  }

  public getMemberInference(): MemberInference {
    return (this._memberInference ??= new MemberInference(
      this.state,
      this.getRelationshipAnalyzer(),
    ))
  }
}
