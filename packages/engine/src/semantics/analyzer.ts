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

    // Paso 1: Descubrimiento (Registro de entidades explícitas)
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

    // Paso 2: Definición (Miembros y Tipos)
    this.currentNamespace = []
    walkAST(
      program,
      new DefinitionVisitor(this.symbolTable, this.currentNamespace, this.entityAnalyzer),
    )

    // Paso 3: Resolución (Relaciones y Entidades Implícitas)
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

    // Paso 4: Inferencia y Validaciones Finales
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
          // Si no tiene operador explícito, asumimos ASOCIACIÓN (UML estándar)
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
    multiplicity?: string,
    visibility?: IRVisibility,
    line?: number,
    column?: number,
  ): void {
    if (TypeValidator.isPrimitive(typeName)) return
    const baseType = TypeValidator.getBaseTypeName(typeName)
    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      baseType,
      fromNamespace || '',
      {},
      line,
      column,
    )

    // Push relationship...
    this.relationships.push({
      from: fromFQN,
      to: toFQN,
      type: relType,
      label: label || '',
      toMultiplicity: multiplicity,
      visibility: visibility || IRVisibility.PUBLIC,
      line,
      column,
    })
  }

  private cleanupRedundantMembers(): void {
    // Logic to be implemented if required for cleaner diagrams
  }
}

/**
 * Visitantes del Analizador Semántico.
 * Implementan una estrategia de 3 pasadas para resolver referencias hacia adelante.
 */

/**
 * Pasada 1: Registra las entidades para que sean conocidas globalmente.
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
    this.currentNamespace.push(node.name)
    node.body.forEach((stmt) => walkAST(stmt, this))
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

  visitRelationship(_node: RelationshipNode): void {}
  visitComment(_node: CommentNode): void {}
  visitConfig(node: ConfigNode): void {
    this.analyzer.addConfig(node.options)
  }
}

/**
 * Pasada 2: Procesa los miembros y sus tipos ahora que todas las entidades son conocidas.
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
}

/**
 * Pasada 3: Resuelve relaciones y genera entidades implícitas si es necesario.
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
    node.relationships.forEach((rel) => {
      const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
        rel.target,
        ns,
        {
          isAbstract: rel.targetIsAbstract,
        },
        rel.line,
        rel.column,
      )
      this.relationshipAnalyzer.addRelationship(fromFQN, toFQN, rel.kind)
    })
  }

  visitRelationship(node: RelationshipNode): void {
    const ns = this.currentNamespace.join('.')
    const fromFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      node.from,
      ns,
      {
        isAbstract: node.fromIsAbstract,
      },
      node.line,
      node.column,
    )
    const toFQN = this.relationshipAnalyzer.resolveOrRegisterImplicit(
      node.to,
      ns,
      {
        isAbstract: node.toIsAbstract,
      },
      node.line,
      node.column,
    )
    this.relationshipAnalyzer.addRelationship(fromFQN, toFQN, node.kind, node)
  }

  visitComment(_node: CommentNode): void {}
  visitConfig(_node: ConfigNode): void {}
}
