import type { Token } from '@engine/syntax/token.types'
import type { ProgramNode, StatementNode } from '@engine/syntax/nodes'
import { ParserContext } from '@engine/parser/parser.context'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import type { MemberRegistry } from '@engine/parser/rules/member-strategies/member.registry'
import type { TypeRegistry } from '@engine/parser/rules/type-strategies/type.registry'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

/**
 * Parser: El protagonista y cerebro del proceso de transformación.
 * Orquesta las reglas, gestiona el ciclo de vida del reporte de errores
 * y aplica las estrategias de recuperación (Panic Mode).
 */
export class Parser implements Orchestrator {
  private readonly rules: StatementRule[]
  private readonly members: MemberRegistry
  private readonly types: TypeRegistry

  constructor(rules: StatementRule[], members: MemberRegistry, types: TypeRegistry) {
    this.rules = rules
    this.members = members
    this.types = types
  }

  public parse(tokens: Token[]): ProgramNode {
    // El Parser (Cerebro) inicializa los recursos de la sesión
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter, this.members, this.types)

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
        context.sync(() => this.rules.some((rule) => rule.canHandle(context)))
      } finally {
        // La sesión se limpia en cada ciclo para evitar que el estado (ej. docs)
        // se arrastre entre sentencias fallidas o exitosas.
        context.clearSession()
      }
    }

    return ASTFactory.createProgram(
      body,
      firstToken?.line ?? 1,
      firstToken?.column ?? 1,
      reporter.getDiagnostics(),
    )
  }

  /**
   * Intenta parsear una sentencia delegando en las reglas registradas.
   */
  public parseStatement(context: IParserHub): StatementNode[] {
    const rule = this.rules.find((r) => r.canHandle(context))
    return rule ? rule.parse(context, this) : []
  }
}
