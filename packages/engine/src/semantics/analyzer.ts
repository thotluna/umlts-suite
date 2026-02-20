import type { ProgramNode } from '../syntax/nodes'
import { type IRDiagram, IREntityType, IRRelationshipType } from '../generator/ir/models'
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

// Passes
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
 * Semantic Analyzer (Refactored).
 * Orchestrates the analysis process by coordinating specialized passes and components.
 * It now acts as a Facade/Director, delegating all logic to the new architecture.
 */
export class SemanticAnalyzer {
  private readonly pluginManager = new PluginManager()

  // Facade accessors for backward compatibility or external usage
  public getPluginManager(): PluginManager {
    return this.pluginManager
  }

  /**
   * Main entry point for semantic analysis.
   */
  public analyze(program: ProgramNode, context: ParserContext): IRDiagram {
    // 1. Initialize State Container (Session)
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

    // 2. Initialize Analyzers & Validators
    // (These are still "heavy" services that manipulate the session state)
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
      session.relationships, // Binds directly to session state
      hierarchyValidator,
      context,
    )

    // 3. Initialize Resolution Architecture
    const typePipeline = new TypeResolutionPipeline()
    typePipeline.add(new UMLTypeResolver())
    // Add dynamic plugin support
    typePipeline.add(new PluginTypeResolutionAdapter(this.pluginManager))

    const memberInference = new MemberInference(session, relationshipAnalyzer, typePipeline)
    const assocClassResolver = new AssociationClassResolver(
      session,
      relationshipAnalyzer,
      [], // Initial empty namespace
    )

    // 4. Initialize Passes
    const discoveryPass = new DiscoveryPass(session, entityAnalyzer, hierarchyValidator)
    const definitionPass = new DefinitionPass(session, entityAnalyzer)
    const resolutionPass = new ResolutionPass(
      session,
      relationshipAnalyzer,
      constraintAnalyzer,
      assocClassResolver,
    )

    // 5. Execute Passes (The 3-Pass Compiler Strategy)

    // Pass 1: Discovery (Register entities, namespaces, config)
    discoveryPass.run(program)

    // Pass 2: Definition (Add members, process internals)
    definitionPass.run(program)

    // Pass 3: Resolution (Connect relationships, implicit entities)
    resolutionPass.run(program)

    // 6. Post-Process Inference
    memberInference.run()

    // 7. Final Validation
    hierarchyValidator.validateNoCycles(session.relationships)

    // 7.5 Refine DataType semantics (Revert to Class/Interface if part of a hierarchy)
    this.refineDataTypeSemantics(session)

    // 8. Output Generation
    return session.toIRDiagram()
  }

  /**
   * Refines the entity type of DataType candidates.
   * If a DataType is implemented or extended, it must regain its identity
   * as a Class or Interface.
   */
  private refineDataTypeSemantics(session: AnalysisSession): void {
    const isTS = session.configStore.get().language === 'typescript'
    if (!isTS) return

    session.relationships.forEach((rel) => {
      const target = session.symbolTable.get(rel.to)
      if (!target || target.type !== IREntityType.DATA_TYPE) return

      const source = session.symbolTable.get(rel.from)
      if (!source) return

      // Rule: If implemented, it must be an Interface
      if (rel.type === IRRelationshipType.IMPLEMENTATION) {
        target.type = IREntityType.INTERFACE
      } else if (rel.type === IRRelationshipType.INHERITANCE) {
        // Rule: If inherited, matches source (Interface >> Interface or Class >> Class)
        if (source.type === IREntityType.INTERFACE) {
          target.type = IREntityType.INTERFACE
        } else {
          target.type = IREntityType.CLASS
        }
      }
    })
  }
}
