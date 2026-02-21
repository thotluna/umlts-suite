import type { ProgramNode } from '../syntax/nodes'
import { type IRDiagram, IREntityType, IRRelationshipType } from '../generator/ir/models'
import { BUILTIN_PLUGINS } from '../plugins'
import type { ParserContext } from '../parser/parser.context'

// Core Components
import { SymbolTable } from './symbol-table'
import { PluginManager } from '../plugins/plugin-manager'

// Session & State
import { AnalysisSession } from './session/analysis-session'
import { ConfigStore } from './session/config-store'
import { ConstraintRegistry } from './session/constraint-registry'

// Analyzers & Validators
import { EntityAnalyzer } from './analyzers/entity-analyzer'
import { RelationshipAnalyzer } from './analyzers/relationship-analyzer'
import { ConstraintAnalyzer } from './analyzers/constraint-analyzer'
import { HierarchyValidator } from './validators/hierarchy-validator'

// Pipeline & Passes
import { SemanticPipeline } from './passes/semantic-pipeline'
import { DiscoveryPass } from './passes/discovery.pass'
import { DefinitionPass } from './passes/definition.pass'
import { ResolutionPass } from './passes/resolution.pass'

// Inference & Resolution Strategy
import { TypeResolutionPipeline } from './inference/type-resolution.pipeline'
import { UMLTypeResolver } from './inference/uml-type-resolver'
import { PluginTypeResolutionAdapter } from './inference/plugin-adapter'
import { MemberInference } from './inference/member-inference'
import { AssociationClassResolver } from './resolvers/association-class.resolver'

/**
 * Semantic Analyzer (Refactored to Pipeline).
 * Orquesta el proceso de análisis coordinando pases especializados a través de una tubería.
 */
export class SemanticAnalyzer {
  private readonly pluginManager = new PluginManager()
  private readonly typePipeline: TypeResolutionPipeline

  constructor() {
    // 1. Register built-in plugins
    BUILTIN_PLUGINS.forEach((plugin) => this.pluginManager.register(plugin))

    // 2. Initialize the type resolution pipeline with standard strategies
    this.typePipeline = new TypeResolutionPipeline()
    this.typePipeline.add(new UMLTypeResolver())
    this.typePipeline.add(new PluginTypeResolutionAdapter(this.pluginManager))
  }

  public getPluginManager(): PluginManager {
    return this.pluginManager
  }

  /**
   * Punto de entrada principal para el análisis semántico.
   */
  public analyze(program: ProgramNode, context: ParserContext): IRDiagram {
    // 1. Inicialización de Estado (Sesión)
    const symbolTable = new SymbolTable()
    const constraintRegistry = new ConstraintRegistry()
    const configStore = new ConfigStore(this.pluginManager, symbolTable)

    const session = new AnalysisSession(
      symbolTable,
      constraintRegistry,
      configStore,
      this.pluginManager,
      context,
    )

    // 2. Inicialización de Servicios
    const constraintAnalyzer = new ConstraintAnalyzer(symbolTable, context)
    const hierarchyValidator = new HierarchyValidator(symbolTable, context)
    const entityAnalyzer = new EntityAnalyzer(
      symbolTable,
      constraintAnalyzer,
      context,
      configStore,
      this.pluginManager,
    )
    const relationshipAnalyzer = new RelationshipAnalyzer(
      symbolTable,
      session.relationships,
      hierarchyValidator,
      context,
    )

    const memberInference = new MemberInference(session, relationshipAnalyzer, this.typePipeline)
    const assocClassResolver = new AssociationClassResolver(session, relationshipAnalyzer, [])

    // 4. Configuración de la Tubería Semántica
    const pipeline = new SemanticPipeline()
    pipeline
      .use(new DiscoveryPass(entityAnalyzer, hierarchyValidator))
      .use(new DefinitionPass(entityAnalyzer))
      .use(new ResolutionPass(relationshipAnalyzer, constraintAnalyzer, assocClassResolver))

    // 5. Ejecutar Pases
    pipeline.execute(program, session)

    // 6. Post-Procesamiento (Inferencia y Refinamiento)
    memberInference.run()
    hierarchyValidator.validateNoCycles(session.relationships)
    this.refineDataTypeSemantics(session)

    // 7. Generación de Resultado
    return session.toIRDiagram()
  }

  /**
   * Refina el tipo de las entidades DataType basándose en su uso en la jerarquía.
   */
  private refineDataTypeSemantics(session: AnalysisSession): void {
    const isTS = session.configStore.get().language === 'typescript'
    if (!isTS) return

    session.relationships.forEach((rel) => {
      const source = session.symbolTable.get(rel.from)
      const target = session.symbolTable.get(rel.to)

      if (target && target.type === IREntityType.DATA_TYPE) {
        if (rel.type === IRRelationshipType.IMPLEMENTATION) {
          target.type = IREntityType.INTERFACE
        } else if (rel.type === IRRelationshipType.INHERITANCE) {
          if (source && source.type === IREntityType.INTERFACE) {
            target.type = IREntityType.INTERFACE
          } else {
            target.type = IREntityType.CLASS
          }
        }
      }

      if (source && source.type === IREntityType.DATA_TYPE) {
        if (
          rel.type === IRRelationshipType.INHERITANCE ||
          rel.type === IRRelationshipType.IMPLEMENTATION
        ) {
          source.type = IREntityType.CLASS
        }
      }
    })
  }
}
