import type { ParserContext } from './parser.context';
import type { StatementNode } from './ast/nodes';

export interface StatementRule {
  /**
   * Intenta parsear una sentencia a partir de la posición actual del contexto.
   * Si la regla no aplica, debe devolver null sin avanzar el contexto (o haciendo rollback).
   */
  parse(context: ParserContext, orchestrator: Orchestrator): StatementNode | null;
}

/**
 * Interfaz mínima para que las reglas puedan llamar al orquestador principal
 * (necesario para recursividad en paquetes, por ejemplo).
 */
export interface Orchestrator {
  parseStatement(context: ParserContext): StatementNode | null;
}
