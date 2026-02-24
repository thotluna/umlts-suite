import { SymbolTable } from '@engine/semantics/symbol-table'
import { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'
import { ConfigStore } from '@engine/semantics/session/config-store'
import { AnalysisSession } from '@engine/semantics/session/analysis-session'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'

/**
 * Factory responsible for creating fresh analysis sessions and their dependencies.
 */
export class SessionFactory {
  /**
   * Creates a new AnalysisSession with initialized internal components.
   */
  public create(context: ISemanticContext): AnalysisSession {
    const symbolTable = new SymbolTable()
    const constraintRegistry = new ConstraintRegistry()
    const configStore = new ConfigStore(symbolTable)

    return new AnalysisSession(symbolTable, constraintRegistry, configStore, context)
  }
}
