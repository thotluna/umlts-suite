import { SymbolTable } from '@engine/semantics/symbol-table'
import { ConstraintRegistry } from '@engine/semantics/session/constraint-registry'
import { ConfigStore } from '@engine/semantics/session/config-store'
import { AnalysisSession } from '@engine/semantics/session/analysis-session'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import { TypeResolutionPipeline } from '@engine/semantics/inference/type-resolution.pipeline'

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
    const typeResolver = new TypeResolutionPipeline(
      context.registry?.language.getTypeResolutionStrategies() || [],
    )

    return new AnalysisSession(symbolTable, constraintRegistry, configStore, context, typeResolver)
  }
}
