import type { Token } from '../syntax/token.types'
import { type ProgramNode, type StatementNode, ASTNodeType } from '../nodes'
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

  public parse(tokens: Token[]): ProgramNode {
    const context = new ParserHub(tokens, new DiagnosticReporter())
    const statements: StatementNode[] = []

    while (!context.isAtEnd()) {
      const nodes = this.parseStatement(context)
      if (nodes.length > 0) {
        statements.push(...nodes)
      } else {
        // Modo Pánico: Si ninguna regla puede empezar, sincronizamos hasta la siguiente regla válida
        const token = context.peek()
        context.addError(`Unrecognized statement: ${token.value}`, token)
        context.advance()
      }
    }

    return {
      type: ASTNodeType.PROGRAM,
      body: statements,
      diagnostics: context.getDiagnostics(),
      line: 1,
      column: 1,
    }
  }

  public parseStatement(context: IParserHub): StatementNode[] {
    if (context.isAtEnd()) return []

    for (const rule of this.rules) {
      if (rule.canStart(context)) {
        try {
          return rule.parse(context, this)
        } catch (_e) {
          // Si una regla falla catastróficamente, intentamos con la siguiente
          continue
        }
      }
    }

    return []
  }
}
