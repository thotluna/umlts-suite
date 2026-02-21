import type { Token } from '../syntax/token.types'
import { TokenType } from '../syntax/token.types'
import type { ProgramNode, StatementNode } from '../syntax/nodes'
import { ASTNodeType } from '../syntax/nodes'
import { DiagnosticReporter } from './diagnostic-reporter'
import { ParserHub } from './parser.hub'
import type { IParserHub } from './parser.context'
import type { StatementRule, IOrchestrator } from './rule.types'

/**
 * Parser Engine (Refactored to Orchestrator).
 * Actúa como el orquestador que coordina las reglas de parseo.
 */
export class Parser implements IOrchestrator {
  private readonly rules: StatementRule[]

  constructor(rules: StatementRule[]) {
    this.rules = rules
  }

  /**
   * Punto de entrada principal para el parseo.
   */
  public parse(tokens: Token[]): ProgramNode {
    const reporter = new DiagnosticReporter()
    const context = new ParserHub(tokens, reporter)

    const statements: StatementNode[] = []

    while (!context.isAtEnd()) {
      const nodes = this.parseStatement(context)
      if (nodes.length > 0) {
        statements.push(...nodes)
      } else {
        // Modo Pánico: Si ninguna regla puede empezar, sincronizamos hasta la siguiente regla válida
        context.addError('Unexpected token', context.peek())
        context.sync(() => this.rules.some((rule) => rule.canStart(context)))
      }
    }

    return {
      type: ASTNodeType.PROGRAM,
      statements,
    }
  }

  /**
   * Implementación de IOrchestrator: permite que las reglas soliciten el parseo de una sentencia.
   */
  public parseStatement(context: IParserHub): StatementNode[] {
    for (const rule of this.rules) {
      if (rule.canStart(context)) {
        try {
          return rule.parse(context, this)
        } catch (_e) {
          // Si una regla falla a mitad de camino, intentamos sincronizar
          context.sync(() => this.rules.some((r) => r.canStart(context)))
          return []
        }
      }
    }
    return []
  }
}
