import type { ProgramNode } from '@engine/syntax/nodes'
import type { IRDiagram } from '@engine/generator/ir/models'
import { BUILTIN_PLUGINS } from '@engine/plugins'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'

// Core Components
import { SymbolTable } from '@engine/semantics/symbol-table'
import { PluginManager } from '@engine/plugins/plugin-manager'

// Session & State
import { AnalysisSession } from '@engine/semantics/session/analysis-session'
import { ConfigStore } from '@engine/semantics/session/config-store'
import { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'

// Pipeline & Passes
import { SemanticPipeline } from '@engine/semantics/passes/semantic-pipeline'
import { DiscoveryPass } from '@engine/semantics/passes/discovery.pass'
import { DefinitionPass } from '@engine/semantics/passes/definition.pass'
import { ResolutionPass } from '@engine/semantics/passes/resolution.pass'

// Inference & Resolution Strategy
import { TypeResolutionPipeline } from '@engine/semantics/inference/type-resolution.pipeline'
import { UMLTypeResolver } from '@engine/semantics/inference/uml-type-resolver'
import { PluginTypeResolutionAdapter } from '@engine/semantics/inference/plugin-adapter'
import { SemanticTargetType } from './core/semantic-rule.interface'

// Factories & Providers
import { SemanticServicesFactory } from '@engine/semantics/factories/semantic-services.factory'
import { UMLRuleProvider } from '@engine/semantics/factories/rule-provider'

/**
 * Semantic Analyzer (Refactored to Lean Orchestrator).
 * Orquesta el proceso de análisis coordinando pases especializados a través de una tubería.
 */
export class SemanticAnalyzer {
  private readonly pluginManager: PluginManager
  private readonly typePipeline: TypeResolutionPipeline

  constructor(pluginManager?: PluginManager, typePipeline?: TypeResolutionPipeline) {
    this.pluginManager = pluginManager ?? new PluginManager()

    if (!pluginManager) {
      BUILTIN_PLUGINS.forEach((plugin) => this.pluginManager.register(plugin))
    }

    this.typePipeline = typePipeline ?? this.createDefaultTypePipeline(this.pluginManager)
  }

  private createDefaultTypePipeline(pluginManager: PluginManager): TypeResolutionPipeline {
    const pipeline = new TypeResolutionPipeline()
    pipeline.add(new UMLTypeResolver())
    pipeline.add(new PluginTypeResolutionAdapter(pluginManager))
    return pipeline
  }

  public getPluginManager(): PluginManager {
    return this.pluginManager
  }

  /**
   * Punto de entrada principal para el análisis semántico.
   */
  public analyze(program: ProgramNode, context: ISemanticContext): IRDiagram {
    const session = this.createSession(context)
    const factory = new SemanticServicesFactory(session, this.typePipeline)

    // 1. Initialize Services
    const validationEngine = factory.createValidationEngine()
    UMLRuleProvider.registerDefaultRules(validationEngine, session.symbolTable)

    const constraintAnalyzer = factory.createConstraintAnalyzer()
    const hierarchyValidator = factory.createHierarchyValidator()
    const entityAnalyzer = factory.createEntityAnalyzer(constraintAnalyzer)
    const relationshipAnalyzer = factory.createRelationshipAnalyzer(hierarchyValidator)
    const memberInference = factory.createMemberInference(relationshipAnalyzer)
    const assocClassResolver = factory.createAssociationClassResolver(relationshipAnalyzer)

    // 2. Execute Pipeline
    const pipeline = new SemanticPipeline()
    pipeline
      .use(new DiscoveryPass(entityAnalyzer, hierarchyValidator))
      .use(new DefinitionPass(entityAnalyzer))
      .use(new ResolutionPass(relationshipAnalyzer, constraintAnalyzer, assocClassResolver))

    pipeline.execute(program, session)

    // 3. Post-Processing & Refinement
    memberInference.run()

    const diagram = session.toIRDiagram()

    // 4. Semantic Validations
    validationEngine.execute(SemanticTargetType.DIAGRAM, diagram, session.context)

    for (const entity of diagram.entities) {
      validationEngine.execute(SemanticTargetType.ENTITY, entity, session.context)
    }

    for (const rel of diagram.relationships) {
      validationEngine.execute(SemanticTargetType.RELATIONSHIP, rel, session.context)
    }

    // 5. Language-Specific Refinements
    this.pluginManager.getActive()?.onPostAnalysis?.(session)

    return session.toIRDiagram()
  }

  private createSession(context: ISemanticContext): AnalysisSession {
    const symbolTable = new SymbolTable()
    const constraintRegistry = new ConstraintRegistry()
    const configStore = new ConfigStore(this.pluginManager, symbolTable)

    return new AnalysisSession(
      symbolTable,
      constraintRegistry,
      configStore,
      this.pluginManager,
      context,
    )
  }
}
