import { type ASTVisitor, walkAST } from '../../syntax/visitor'
import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  CommentNode,
  ConfigNode,
  AssociationClassNode,
  ConstraintNode,
} from '../../syntax/nodes'
import { DiagnosticCode } from '../../syntax/diagnostic.types'
import { TokenType, type Token } from '../../syntax/token.types'
import type { AnalysisSession } from '../session/analysis-session'
import type { EntityAnalyzer } from '../analyzers/entity-analyzer'
import type { HierarchyValidator } from '../validators/hierarchy-validator'

/**
 * Pass 1: Discovery.
 * Registers entities so they are known globally.
 * Extracted from SemanticAnalyzer.
 */
export class DiscoveryPass implements ASTVisitor {
  private currentNamespace: string[] = []

  constructor(
    private readonly session: AnalysisSession,
    private readonly entityAnalyzer: EntityAnalyzer,
    private readonly hierarchyValidator: HierarchyValidator,
  ) {}

  public run(program: ProgramNode): void {
    this.currentNamespace = []
    walkAST(program, this)
  }

  visitProgram(node: ProgramNode): void {
    ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
  }

  visitPackage(node: PackageNode): void {
    const fqn =
      this.currentNamespace.length > 0
        ? `${this.currentNamespace.join('.')}.${node.name}`
        : node.name
    this.session.symbolTable.registerNamespace(fqn)

    this.currentNamespace.push(node.name)
    ;(node.body || []).forEach((stmt) => walkAST(stmt, this))
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const entity = this.entityAnalyzer.buildEntity(node, this.currentNamespace.join('.'))
    const existing = this.session.symbolTable.get(entity.id)

    if (existing != null && !existing.isImplicit) {
      if (this.session.context) {
        this.session.context.addError(
          `Duplicate entity: '${entity.id}' is already defined in this scope.`,
          { line: node.line, column: node.column, type: TokenType.UNKNOWN, value: '' } as Token,
          DiagnosticCode.SEMANTIC_DUPLICATE_ENTITY,
        )
      }
      return
    }

    if (this.session.symbolTable.isNamespace(entity.id)) {
      if (this.session.context) {
        this.session.context.addError(
          `Namespace collision: '${entity.id}' is already defined as a Package. Entities cannot have the same name as a package in the same scope.`,
          { line: node.line, column: node.column, type: TokenType.UNKNOWN, value: '' } as Token,
          DiagnosticCode.SEMANTIC_DUPLICATE_ENTITY,
        )
      }
      return
    }

    this.session.symbolTable.register(entity)
    this.hierarchyValidator.validateEntity(entity)
  }

  visitRelationship(_node: RelationshipNode): void {
    // Relationships are processed in Pass 3 (Resolution)
  }

  visitComment(_node: CommentNode): void {
    // Comments have no semantic impact in this pass
  }

  visitConfig(node: ConfigNode): void {
    this.session.configStore.merge(node.options)
  }

  visitAssociationClass(node: AssociationClassNode): void {
    const entity = this.entityAnalyzer.buildAssociationClass(node, this.currentNamespace.join('.'))
    this.session.symbolTable.register(entity)
    this.hierarchyValidator.validateEntity(entity)
  }

  visitConstraint(_node: ConstraintNode): void {
    // Constraints are processed in ResolutionPass or DefinitionPass
  }
}
