import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  CommentNode,
  ConfigNode,
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
import { TokenType } from '../lexer/token.types'
import type { Token } from '../lexer/token.types'
import { IRRelationshipType, IRVisibility } from '../generator/ir/models'

/**
 * Analizador Semántico que transforma el AST en una IR resuelta.
 * Orquesta la lógica mediante analizadores especializados.
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

    // Inicializar sub-componentes
    this.hierarchyValidator = new HierarchyValidator(this.symbolTable, context)
    this.entityAnalyzer = new EntityAnalyzer(this.symbolTable, context)
    this.relationshipAnalyzer = new RelationshipAnalyzer(
      this.symbolTable,
      this.relationships,
      this.hierarchyValidator,
      context,
    )

    // Paso 1: Recolectar declaraciones explícitas
    walkAST(
      program,
      new DeclarationVisitor(
        this,
        this.symbolTable,
        this.currentNamespace,
        this.entityAnalyzer,
        context,
      ),
    )

    // Paso 2: Procesar relaciones y crear entidades implícitas
    this.currentNamespace = []
    walkAST(
      program,
      new RelationshipVisitor(
        this,
        this.symbolTable,
        this.relationships,
        this.currentNamespace,
        this.relationshipAnalyzer,
        context,
      ),
    )

    // Paso 3: Inferencia y Validaciones Finales
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
        if (member.type && member.relationshipKind) {
          this.inferFromType(
            entity.id,
            member.type,
            entity.namespace,
            member.name,
            this.relationshipAnalyzer.mapRelationshipType(member.relationshipKind),
            member.multiplicity,
            member.visibility,
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
    multiplicity?: string,
    visibility?: IRVisibility,
  ): void {
    if (TypeValidator.isPrimitive(typeName)) return
    const baseType = TypeValidator.getBaseTypeName(typeName)
    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(baseType, fromNamespace || '')

    // Push relationship...
    this.relationships.push({
      from: fromFQN,
      to: toFQN,
      type: relType,
      label: label || '',
      toMultiplicity: multiplicity,
      visibility: visibility || IRVisibility.PUBLIC,
    })
  }

  private cleanupRedundantMembers(): void {
    // Logic to be implemented if required for cleaner diagrams
  }
}

/**
 * Visitantes simplificados que delegan en los analyzers especializados.
 */
class DeclarationVisitor implements ASTVisitor {
  constructor(
    private readonly analyzer: SemanticAnalyzer,
    private readonly symbolTable: SymbolTable,
    private readonly currentNamespace: string[],
    private readonly entityAnalyzer: EntityAnalyzer,
    private readonly context: ParserContext,
  ) {}

  visitProgram(node: ProgramNode): void {
    node.body.forEach((stmt) => {
      walkAST(stmt, this)
    })
  }

  visitPackage(node: PackageNode): void {
    this.currentNamespace.push(node.name)
    node.body.forEach((stmt) => {
      walkAST(stmt, this)
    })
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const entity = this.entityAnalyzer.buildEntity(node, this.currentNamespace.join('.'))
    const existing = this.symbolTable.get(entity.id)

    if (existing != null && !existing.isImplicit) {
      this.context.addError(
        `Entidad duplicada: '${entity.id}' ya está definida en este ámbito.`,
        { line: node.line, column: node.column, type: TokenType.UNKNOWN, value: '' } as Token,
        DiagnosticCode.SEMANTIC_DUPLICATE_ENTITY,
      )
      return
    }

    this.symbolTable.register(entity)
  }

  visitRelationship(_node: RelationshipNode): void {
    // Relationship resolution happens in second pass
  }

  visitComment(_node: CommentNode): void {
    // Comments are ignored
  }

  visitConfig(node: ConfigNode): void {
    this.analyzer.addConfig(node.options)
  }
}

class RelationshipVisitor implements ASTVisitor {
  constructor(
    private readonly analyzer: SemanticAnalyzer,
    private readonly symbolTable: SymbolTable,
    private readonly relationships: IRRelationship[],
    private readonly currentNamespace: string[],
    private readonly relationshipAnalyzer: RelationshipAnalyzer,
    private readonly context: ParserContext,
  ) {}

  visitProgram(node: ProgramNode): void {
    node.body.forEach((stmt) => {
      walkAST(stmt, this)
    })
  }

  visitPackage(node: PackageNode): void {
    this.currentNamespace.push(node.name)
    node.body.forEach((stmt) => {
      walkAST(stmt, this)
    })
    this.currentNamespace.pop()
  }

  visitEntity(node: EntityNode): void {
    const ns = this.currentNamespace.join('.')
    const fromFQN = this.symbolTable.resolveFQN(node.name, ns)
    node.relationships.forEach((rel) => {
      const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(rel.target, ns, {
        isAbstract: rel.targetIsAbstract,
      })
      this.relationshipAnalyzer.addRelationship(fromFQN, toFQN, rel.kind)
    })
  }

  visitRelationship(node: RelationshipNode): void {
    const ns = this.currentNamespace.join('.')
    const fromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(node.from, ns, {
      isAbstract: node.fromIsAbstract,
    })
    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(node.to, ns, {
      isAbstract: node.toIsAbstract,
    })
    this.relationshipAnalyzer.addRelationship(fromFQN, toFQN, node.kind, node)
  }

  visitComment(_node: CommentNode): void {
    // Comments are ignored
  }

  visitConfig(_node: ConfigNode): void {
    // Config handled in first pass
  }
}
