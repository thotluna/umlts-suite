import type { IRDiagram, IRRelationship } from '../../generator/ir/models'
import type { IParserHub } from '../../parser/parser.context'
import type { PluginManager } from '../../plugins/plugin-manager'
import type { SymbolTable } from '../symbol-table'
import type { ConstraintRegistry } from './constraint-registry'
import type { ConfigStore } from './config-store'

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
    public readonly context: IParserHub,
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
