import type { ProgramNode } from '@engine/syntax/nodes'
import type { IRDiagram } from '@engine/generator/ir/models'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import type { WorkspaceContext } from '@engine/semantics/session/context/workspace'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'

/**
 * Gestiona el análisis semántico de forma concurrente/incremental
 * cuando hay múltiples archivos en el Workspace. Esta clase encapsula
 * la lógica de orquestación de multi-tenancy y multi-archivo.
 */
export class IncrementalAnalyzer {
  constructor(private readonly baseAnalyzer: SemanticAnalyzer) {}

  /**
   * Analiza un nuevo AST actualizando el grafo global del Workspace
   * sin destruir la información de archivos anteriores intactos.
   */
  public analyzeIncremental(
    program: ProgramNode,
    context: ISemanticContext,
    workspace: WorkspaceContext,
  ): IRDiagram {
    // Phase 3 placeholder:
    // Future logic: identify which File/Module this AST belongs to,
    // update only that portion of the SymbolTable,
    // re-run partial passes, and re-emit diagnostics.

    // A term short, we fallback to full re-analysis while passing the context
    return this.baseAnalyzer.analyze(program, context, workspace)
  }
}
