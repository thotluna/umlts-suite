import type { ProgramNode } from '@engine/syntax/nodes'
import { SemanticPipeline } from '@engine/semantics/passes/semantic-pipeline'
import { DiscoveryPass } from '@engine/semantics/passes/discovery.pass'
import { DefinitionPass } from '@engine/semantics/passes/definition.pass'
import { ResolutionPass } from '@engine/semantics/passes/resolution.pass'
import type { SemanticServicesProvider } from '@engine/semantics/factories/services-provider'
import type { ISemanticState } from '@engine/semantics/core/semantic-state.interface'

/**
 * Orchestrates the execution of the standard UML semantic analysis pipeline.
 */
export class SemanticPipelineOrchestrator {
  constructor(private readonly services: SemanticServicesProvider) {}

  /**
   * Executes the discovery, definition, and resolution passes on the program.
   */
  public execute(program: ProgramNode, state: ISemanticState): void {
    const pipeline = new SemanticPipeline()

    pipeline
      .use(
        new DiscoveryPass(this.services.getEntityAnalyzer(), this.services.getHierarchyValidator()),
      )
      .use(new DefinitionPass(this.services.getEntityAnalyzer()))
      .use(
        new ResolutionPass(
          this.services.getRelationshipAnalyzer(),
          this.services.getConstraintAnalyzer(),
          this.services.getAssociationClassResolver(),
        ),
      )

    pipeline.execute(program, state)
  }
}
