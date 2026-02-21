import type { StatementNode } from '../syntax/nodes'
import type { IParserHub } from './parser.context'

/**
 * Interface for a top-level statement parsing rule.
 */
export interface StatementRule {
  /**
   * Intenta parsear una sentencia a partir de la posición actual del contexto.
   * Si la regla no aplica, debe devolver null sin avanzar el contexto (o haciendo rollback).
   */
  parse: (context: IParserHub, orchestrator: IOrchestrator) => StatementNode[]

  /**
   * Indica si la regla puede comenzar con el token actual.
   * Útil para recuperación de errores y sincronización.
   */
  canStart: (context: IParserHub) => boolean
}

/**
 * Orchestrator interface to allow rules to call back into the main parsing loop (Recursion).
 */
export interface IOrchestrator {
  parseStatement: (context: IParserHub) => StatementNode[]
}
