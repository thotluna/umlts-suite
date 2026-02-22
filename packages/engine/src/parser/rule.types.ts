import type { IParserHub } from './core/parser.hub'
import type { StatementNode } from '../syntax/nodes'

export interface StatementRule {
  /**
   * Intenta parsear una sentencia a partir de la posición actual del contexto.
   * Si la regla no aplica, debe devolver null sin avanzar el contexto (o haciendo rollback).
   */
  parse: (context: IParserHub, orchestrator: Orchestrator) => StatementNode[]

  /**
   * Indica si la regla puede comenzar con el token actual.
   * Útil para recuperación de errores y sincronización.
   */
  canStart: (context: IParserHub) => boolean
}

/**
 * Interfaz mínima para que las reglas puedan llamar al orquestador principal
 * (necesario para recursividad en paquetes, por ejemplo).
 */
export interface Orchestrator {
  parseStatement: (context: IParserHub) => StatementNode[]
}
