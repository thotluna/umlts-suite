import type { Token } from '../syntax/token.types'
import { ASTNodeType } from '../syntax/nodes'
import type { ProgramNode, StatementNode } from '../syntax/nodes'
import { ParserContext } from './parser.context'
import { DiagnosticReporter } from './diagnostic-reporter'
import type { StatementRule, Orchestrator } from './rule.types'
import type { LanguagePlugin } from '../plugins/language-plugin'

/**
 * Parser: El protagonista y cerebro del proceso de transformación.
 * Orquesta las reglas, gestiona el ciclo de vida del reporte de errores
 * y aplica las estrategias de recuperación (Panic Mode).
 */
export class Parser implements Orchestrator {
  private readonly rules: StatementRule[]

  constructor(rules: StatementRule[]) {
    this.rules = rules
  }

  public parse(tokens: Token[], plugin?: LanguagePlugin): ProgramNode {
    // El Parser (Cerebro) inicializa los recursos de la sesión
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter, plugin)

    const body: StatementNode[] = []
    const firstToken = context.peek()

    while (!context.isAtEnd()) {
      try {
        const startPos = context.getPosition()
        const nodes = this.parseStatement(context)
        if (nodes.length > 0) {
          body.push(...nodes)
        } else if (context.getPosition() === startPos) {
          // Si ninguna regla consumió nada y no estamos al final, hay fuego
          throw new Error('Unrecognized statement')
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown syntax error'
        reporter.addError(message, context.peek())

        // El Parser toma el mando estratégico: "Busca un punto seguro"
        context.sync(() => this.rules.some((rule) => rule.canStart(context)))
      }
    }

    return {
      type: ASTNodeType.PROGRAM,
      body,
      line: firstToken?.line ?? 1,
      column: firstToken?.column ?? 1,
      diagnostics: reporter.getDiagnostics(),
    }
  }

  /**
   * Intenta parsear una sentencia delegando en las reglas registradas.
   */
  public parseStatement(context: ParserContext): StatementNode[] {
    if (context.isAtEnd()) return []

    const startPos = context.getPosition()
    for (const rule of this.rules) {
      if (rule.canStart(context)) {
        const nodes = rule.parse(context, this)
        if (nodes.length > 0 || context.getPosition() > startPos) return nodes
      }
    }

    return []
  }
}
