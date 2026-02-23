import type { ProgramNode } from '@engine/syntax/nodes'
import { type IRDiagram, IREntityType, IRRelationshipType } from '@engine/generator/ir/models'
import { BUILTIN_PLUGINS } from '@engine/plugins'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'

// Core Components
import { SymbolTable } from '@engine/semantics/symbol-table'
import { PluginManager } from '@engine/plugins/plugin-manager'

// Session & State
import { AnalysisSession } from '@engine/semantics/session/analysis-session'
import { ConfigStore } from '@engine/semantics/session/config-store'
import { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'

// Analyzers & Validators
import { EntityAnalyzer } from '@engine/semantics/analyzers/entity-analyzer'
import { RelationshipAnalyzer } from '@engine/semantics/analyzers/relationship-analyzer'
import { ConstraintAnalyzer } from '@engine/semantics/analyzers/constraint-analyzer'
import { ValidationEngine } from '@engine/semantics/core/validation-engine'
import { EntityModifierRule } from '@engine/semantics/rules/entity/entity-modifier.rule'
import { InheritanceCycleRule } from '@engine/semantics/rules/diagram/inheritance-cycle.rule'
import { CompositionTargetRule } from '@engine/semantics/rules/relationship/composition-target.rule'
import { PackageTargetRule } from '@engine/semantics/rules/relationship/package-target.rule'
import { GeneralizationRule } from '@engine/semantics/rules/relationship/generalization.rule'
import { HierarchyValidator } from '@engine/semantics/validators/hierarchy-validator'

// Pipeline & Passes
import { SemanticPipeline } from '@engine/semantics/passes/semantic-pipeline'
import { DiscoveryPass } from '@engine/semantics/passes/discovery.pass'
import { DefinitionPass } from '@engine/semantics/passes/definition.pass'
import { ResolutionPass } from '@engine/semantics/passes/resolution.pass'

// Inference & Resolution Strategy
import { TypeResolutionPipeline } from '@engine/semantics/inference/type-resolution.pipeline'
import { UMLTypeResolver } from '@engine/semantics/inference/uml-type-resolver'
import { PluginTypeResolutionAdapter } from '@engine/semantics/inference/plugin-adapter'
import { MemberInference } from '@engine/semantics/inference/member-inference'
import { AssociationClassResolver } from '@engine/semantics/resolvers/association-class.resolver'

/**
 * Semantic Analyzer (Refactored to Pipeline).
 * Orquesta el proceso de análisis coordinando pases especializados a través de una tubería.
 */
export class SemanticAnalyzer {
  private readonly pluginManager: PluginManager
  private readonly typePipeline: TypeResolutionPipeline

  constructor(pluginManager?: PluginManager) {
    this.pluginManager = pluginManager ?? new PluginManager()

    if (!pluginManager) {
      BUILTIN_PLUGINS.forEach((plugin) => this.pluginManager.register(plugin))
    }

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
  public analyze(program: ProgramNode, context: ISemanticContext): IRDiagram {
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
    const validationEngine = new ValidationEngine()
    validationEngine
      .register(new EntityModifierRule())
      .register(new InheritanceCycleRule(symbolTable))
      .register(new CompositionTargetRule(symbolTable))
      .register(new PackageTargetRule(symbolTable))
      .register(new GeneralizationRule(symbolTable))

    // Validations now managed mostly by ValidationEngine, except some dependencies inside passes.
    // However, some passes temporarily require HierarchyValidator for older interfaces.
    // For now we will keep dummy/mock usage or refactor passes if needed.
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

    // Ejecución de Reglas Atómicas V3:
    validationEngine.validate(session.toIRDiagram(), session.context)

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
