import type { IRDiagram, IRRelationship } from '@engine/generator/ir/models'
import type { ParserContext } from '@engine/parser/parser.context'
import type { PluginManager } from '@engine/plugins/plugin-manager'
import type { SymbolTable } from '@engine/semantics/symbol-table'
import type { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'
import type { ConfigStore } from '@engine/semantics/session/config-store'

/**
 * Encapsulates the complete state of a semantic analysis session.
 *
 * This context object breaks the bidirectional coupling between visitors and the analyzer.
 * Visitors now depend on this neutral state container instead of the SemanticAnalyzer orchestrator.
 */
export class AnalysisSession {
  public readonly relationships: IRRelationship[] = []

  constructor(
    public readonly symbolTable: SymbolTable,
    public readonly constraintRegistry: ConstraintRegistry,
    public readonly configStore: ConfigStore,
    public readonly pluginManager: PluginManager,
    public readonly context: ParserContext,
  ) {}

  /**
   * Compiles the current session state into the final IR Diagram.
   */
  public toIRDiagram(): IRDiagram {
    return {
      entities: this.symbolTable.getAllEntities(),
      relationships: this.relationships,
      constraints: this.constraintRegistry.getAll(),
      config: this.configStore.get(),
    }
  }
}
