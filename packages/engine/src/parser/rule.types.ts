import type { StatementNode } from '../syntax/nodes'
import type { IParserHub } from './parser.context'

/**
 * Interface for a top-level statement parsing rule.
 */
export interface StatementRule {
  parse: (context: IParserHub, orchestrator: IOrchestrator) => StatementNode[]
  canStart: (context: IParserHub) => boolean
}

/**
 * Orchestrator interface to allow rules to call back into the main parsing loop (Recursion).
 */
export interface IOrchestrator {
  parseStatement: (context: IParserHub) => StatementNode[]
}
