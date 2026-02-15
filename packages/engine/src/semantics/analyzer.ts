import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  CommentNode,
  ConfigNode,
  AssociationClassNode,
} from '../parser/ast/nodes'
import type { ASTVisitor } from '../parser/ast/visitor'
import { walkAST } from '../parser/ast/visitor'
import type { IRDiagram, IRRelationship } from '../generator/ir/models'
import { SymbolTable } from './symbol-table'
import type { ParserContext } from '../parser/parser.context'
import { EntityAnalyzer } from './analyzers/entity-analyzer'
import { RelationshipAnalyzer } from './analyzers/relationship-analyzer'
import { HierarchyValidator } from './validators/hierarchy-validator'
import { TypeValidator } from './utils/type-validator'
import { DiagnosticCode } from '../parser/diagnostic.types'
import { TokenType, type Token } from '../lexer/token.types'
import { IRRelationshipType, IRVisibility } from '../generator/ir/models'

/**
 * Semantic Analyzer that transforms the AST into a resolved IR.
 * Orchestrates the logic through specialized analyzers.
 */
export class SemanticAnalyzer {
  private readonly symbolTable = new SymbolTable()
  private readonly relationships: IRRelationship[] = []
  private currentNamespace: string[] = []
  private config: Record<string, unknown> = {}
  private context?: ParserContext

  private entityAnalyzer!: EntityAnalyzer
  private relationshipAnalyzer!: RelationshipAnalyzer
  private hierarchyValidator!: HierarchyValidator

  public analyze(program: ProgramNode, context: ParserContext): IRDiagram {
    this.context = context

    // Initialize sub-components
    this.hierarchyValidator = new HierarchyValidator(this.symbolTable, context)
    this.entityAnalyzer = new EntityAnalyzer(this.symbolTable, context)
    this.relationshipAnalyzer = new RelationshipAnalyzer(
      this.symbolTable,
      this.relationships,
      this.hierarchyValidator,
      context,
    )

    // Pass 1: Discovery (Register explicit entities)
    walkAST(
      program,
      new DiscoveryVisitor(
        this,
        this.symbolTable,
        this.currentNamespace,
        this.entityAnalyzer,
        context,
      ),
    )

    // Pass 2: Definition (Members and Types)
    this.currentNamespace = []
    walkAST(
      program,
      new DefinitionVisitor(this.symbolTable, this.currentNamespace, this.entityAnalyzer),
    )

    // Pass 3: Resolution (Relationships and Implicit Entities)
    this.currentNamespace = []
    walkAST(
      program,
      new ResolutionVisitor(
        this,
        this.symbolTable,
        this.relationships,
        this.currentNamespace,
        this.relationshipAnalyzer,
        context,
      ),
    )

    // Pass 4: Inference and Final Validations
    this.inferRelationships()
    this.hierarchyValidator.validateNoCycles(this.relationships)
    this.cleanupRedundantMembers()

    return {
      entities: this.symbolTable.getAllEntities(),
      relationships: this.relationships,
      config: this.config,
    }
  }

  public addConfig(options: Record<string, unknown>): void {
    this.config = { ...this.config, ...options }
  }

  private inferRelationships(): void {
    const entities = this.symbolTable.getAllEntities()
    entities.forEach((entity) => {
      entity.members.forEach((member) => {
        if (member.type) {
          // If no explicit operator, assume ASSOCIATION (Standard UML)
          const relType = member.relationshipKind
            ? this.relationshipAnalyzer.mapRelationshipType(member.relationshipKind)
            : IRRelationshipType.ASSOCIATION

          this.inferFromType(
            entity.id,
            member.type,
            entity.namespace,
            member.name,
            relType,
            member.multiplicity,
            member.visibility,
            undefined, // fromMultiplicity is not inferred from members
            undefined, // associationClassId is not inferred from members
            member.line,
            member.column,
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
  ): void {
    if (TypeValidator.isPrimitive(typeName)) return
    const baseType = TypeValidator.getBaseTypeName(typeName)
    const fromEntity = this.symbolTable.get(fromFQN)
    const inferenceContext = fromEntity
      ? { sourceType: fromEntity.type, relationshipKind: relType }
      : undefined

    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      baseType,
      fromNamespace || '',
      {},
      line,
      column,
      inferenceContext,
    )

    // Use full validation flow
    this.relationshipAnalyzer.addResolvedRelationship(fromFQN, toFQN, relType, {
      line,
      column,
      label,
      toMultiplicity,
      fromMultiplicity,
      visibility,
      associationClassId,
    })
  }

  private cleanupRedundantMembers(): void {
    // Logic to be implemented if required for cleaner diagrams
  }
}

/**
 * Semantic Analyzer Visitors.
 * They implement a 3-pass strategy to resolve forward references.
 */

/**
 * Pass 1: Registers entities so they are known globally.
 */
class DiscoveryVisitor implements ASTVisitor {
  constructor(
    private readonly analyzer: SemanticAnalyzer,
    private readonly symbolTable: SymbolTable,
    private readonly currentNamespace: string[],
    private readonly entityAnalyzer: EntityAnalyzer,
    private readonly context: ParserContext,
  ) {}

  visitProgram(node: ProgramNode): void {
    node.body.forEach((stmt) => walkAST(stmt, this))
  }

  visitPackage(node: PackageNode): void {
    const fqn =
      this.currentNamespace.length > 0
        ? `${this.currentNamespace.join('.')}.${node.name}`
        : node.name
    this.symbolTable.registerNamespace(fqn)

    this.currentNamespace.push(node.name)
    node.body.forEach((stmt) => walkAST(stmt, this))
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const entity = this.entityAnalyzer.buildEntity(node, this.currentNamespace.join('.'))
    const existing = this.symbolTable.get(entity.id)

    if (existing != null && !existing.isImplicit) {
      this.context.addError(
        `Duplicate entity: '${entity.id}' is already defined in this scope.`,
        { line: node.line, column: node.column, type: TokenType.UNKNOWN, value: '' } as Token,
        DiagnosticCode.SEMANTIC_DUPLICATE_ENTITY,
      )
      return
    }

    if (this.symbolTable.isNamespace(entity.id)) {
      this.context.addError(
        `Namespace collision: '${entity.id}' is already defined as a Package. Entities cannot have the same name as a package in the same scope.`,
        { line: node.line, column: node.column, type: TokenType.UNKNOWN, value: '' } as Token,
        DiagnosticCode.SEMANTIC_DUPLICATE_ENTITY,
      )
      return
    }

    this.symbolTable.register(entity)
  }

  visitRelationship(_node: RelationshipNode): void {}
  visitComment(_node: CommentNode): void {}
  visitConfig(node: ConfigNode): void {
    this.analyzer.addConfig(node.options)
  }

  visitAssociationClass(node: AssociationClassNode): void {
    const entity = this.entityAnalyzer.buildAssociationClass(node, this.currentNamespace.join('.'))
    this.symbolTable.register(entity)
  }
}

/**
 * Pass 2: Processes members and their types now that all entities are known.
 */
class DefinitionVisitor implements ASTVisitor {
  constructor(
    private readonly symbolTable: SymbolTable,
    private readonly currentNamespace: string[],
    private readonly entityAnalyzer: EntityAnalyzer,
  ) {}

  visitProgram(node: ProgramNode): void {
    node.body.forEach((stmt) => walkAST(stmt, this))
  }

  visitPackage(node: PackageNode): void {
    this.currentNamespace.push(node.name)
    node.body.forEach((stmt) => walkAST(stmt, this))
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const fqn = this.symbolTable.resolveFQN(node.name, this.currentNamespace.join('.')).fqn
    const entity = this.symbolTable.get(fqn)
    if (entity) {
      this.entityAnalyzer.processMembers(entity, node)
    }
  }

  visitRelationship(_node: RelationshipNode): void {}
  visitComment(_node: CommentNode): void {}
  visitConfig(_node: ConfigNode): void {}

  visitAssociationClass(node: AssociationClassNode): void {
    const fqn = this.symbolTable.resolveFQN(node.name, this.currentNamespace.join('.')).fqn
    const entity = this.symbolTable.get(fqn)
    if (entity && node.body) {
      this.entityAnalyzer.processAssociationClassMembers(entity, node)
    }
  }
}

/**
 * Pass 3: Resolves relationships and generates implicit entities if required.
 */
class ResolutionVisitor implements ASTVisitor {
  constructor(
    private readonly analyzer: SemanticAnalyzer,
    private readonly symbolTable: SymbolTable,
    private readonly relationships: IRRelationship[],
    private readonly currentNamespace: string[],
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
    private readonly context: ParserContext,
  ) {}

  visitProgram(node: ProgramNode): void {
    node.body.forEach((stmt) => walkAST(stmt, this))
  }

  visitPackage(node: PackageNode): void {
    this.currentNamespace.push(node.name)
    node.body.forEach((stmt) => walkAST(stmt, this))
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const ns = this.currentNamespace.join('.')
    const fromFQN = this.symbolTable.resolveFQN(node.name, ns).fqn
    const fromEntity = this.symbolTable.get(fromFQN)

    node.relationships.forEach((rel) => {
      // Calculate inference context
      const relType = this.relationshipAnalyzer.mapRelationshipType(rel.kind)
      const inferenceContext = fromEntity
        ? { sourceType: fromEntity.type, relationshipKind: relType }
        : undefined

      const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
        rel.target,
        ns,
        {
          isAbstract: rel.targetIsAbstract,
        },
        rel.line,
        rel.column,
        inferenceContext,
      )
      this.relationshipAnalyzer.addRelationship(fromFQN, toFQN, rel.kind, rel)
    })
  }

  visitRelationship(node: RelationshipNode): void {
    const ns = this.currentNamespace.join('.')
    const relType = this.relationshipAnalyzer.mapRelationshipType(node.kind)

    // Resolve 'from' entity first
    const fromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      node.from,
      ns,
      {
        isAbstract: node.fromIsAbstract,
      },
      node.line,
      node.column,
    )
    const fromEntity = this.symbolTable.get(fromFQN)

    // Inference for 'to' entity based on 'from' entity type
    const inferenceContext = fromEntity
      ? { sourceType: fromEntity.type, relationshipKind: relType }
      : undefined

    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      node.to,
      ns,
      {
        isAbstract: node.toIsAbstract,
      },
      node.line,
      node.column,
      inferenceContext,
    )
    this.relationshipAnalyzer.addRelationship(fromFQN, toFQN, node.kind, node)
  }

  visitComment(_node: CommentNode): void {}
  visitConfig(_node: ConfigNode): void {}

  visitAssociationClass(node: AssociationClassNode): void {
    const ns = this.currentNamespace.join('.')
    const assocFQN = this.symbolTable.resolveFQN(node.name, ns).fqn

    // Procesar relaciones anidadas en los participantes
    node.participants.forEach((p) => {
      let currentFromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
        p.name,
        ns,
        {},
        node.line,
        node.column,
      )

      p.relationships?.forEach((rel) => {
        const relType = this.relationshipAnalyzer.mapRelationshipType(rel.kind)
        const fromEntity = this.symbolTable.get(currentFromFQN)
        const inferenceContext = fromEntity
          ? { sourceType: fromEntity.type, relationshipKind: relType }
          : undefined

        const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
          rel.target,
          ns,
          { isAbstract: rel.targetIsAbstract },
          rel.line,
          rel.column,
          inferenceContext,
        )
        this.relationshipAnalyzer.addRelationship(currentFromFQN, toFQN, rel.kind, rel)

        // Advance in the chain: the current target becomes the source for the next link
        currentFromFQN = toFQN
      })
    })

    if (node.participants.length !== 2) {
      const context = this.relationshipAnalyzer.getContext()
      if (context) {
        context.addError(
          `Association class '${node.name}' must have exactly 2 participants, found ${node.participants.length}.`,
          {
            line: node.line,
            column: node.column,
            type: TokenType.IDENTIFIER,
            value: node.name,
          } as Token,
          DiagnosticCode.SEMANTIC_INVALID_ASSOCIATION_CLASS,
        )
      }
      if (node.participants.length < 2) return
    }

    const p1 = node.participants[0]
    const p2 = node.participants[1]

    const fromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      p1.name,
      ns,
      {},
      node.line,
      node.column,
    )
    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      p2.name,
      ns,
      {},
      node.line,
      node.column,
    )

    // Creamos la relación y la vinculamos a la clase
    this.relationshipAnalyzer.addResolvedRelationship(
      fromFQN,
      toFQN,
      IRRelationshipType.BIDIRECTIONAL,
      {
        line: node.line,
        column: node.column,
        fromMultiplicity: p1.multiplicity,
        toMultiplicity: p2.multiplicity,
        associationClassId: assocFQN,
      },
    )
  }
}
