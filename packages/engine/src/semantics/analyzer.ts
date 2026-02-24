import type { ProgramNode } from '@engine/syntax/nodes'
import type { IRDiagram } from '@engine/generator/ir/models'
import type { ISemanticContext } from '@engine/semantics/core/semantic-context.interface'
import { SemanticTargetType } from '@engine/semantics/core/semantic-rule.interface'

// Infrastructure & Orchestration
import { SemanticServicesProvider } from '@engine/semantics/factories/services-provider'
import { SemanticPipelineOrchestrator } from '@engine/semantics/passes/pipeline-orchestrator'
import { SessionFactory } from '@engine/semantics/factories/session-factory'

/**
 * Main orchestrator for semantic analysis.
 * Acts as a lean entry point that delegates work to specialized services and pipelines.
 */
export class SemanticAnalyzer {
  private readonly sessionFactory = new SessionFactory()

  /**
   * Performs full semantic analysis on a parsed program.
   */
  public analyze(program: ProgramNode, context: ISemanticContext): IRDiagram {
    // 1. Initialize State
    const session = this.sessionFactory.create(context)

    // 2. Initialize Infrastructure
    const services = new SemanticServicesProvider(session)
    const orchestrator = new SemanticPipelineOrchestrator(services)

    // 3. Execute Standard Pipeline (Passes)
    orchestrator.execute(program, session)

    // 4. Post-processing Refinements
    services.getMemberInference().run()

    // 5. Semantic Validations
    const diagram = session.toIRDiagram()
    const engine = services.getValidationEngine()

    engine.execute(SemanticTargetType.DIAGRAM, diagram, context)
    for (const entity of diagram.entities) {
      engine.execute(SemanticTargetType.ENTITY, entity, context)
    }
    for (const rel of diagram.relationships) {
      engine.execute(SemanticTargetType.RELATIONSHIP, rel, context)
    }

    return diagram
  }
}
