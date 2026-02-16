import type { Token } from '../lexer/token.types'
import { ASTNodeType } from './ast/nodes'
import type { ProgramNode, StatementNode } from './ast/nodes'
import { ParserContext } from './parser.context'
import type { StatementRule, Orchestrator } from './rule.types'

export class Parser implements Orchestrator {
  private readonly rules: StatementRule[]

  constructor(rules: StatementRule[]) {
    this.rules = rules
  }

  public parse(tokens: Token[]): ProgramNode {
    const context = new ParserContext(tokens)
    const body: StatementNode[] = []
    const firstToken = context.peek()

    while (!context.isAtEnd()) {
      try {
        const nodes = this.parseStatement(context)
        if (nodes.length > 0) {
          body.push(...nodes)
        } else {
          context.addError('Unrecognized statement')
          this.synchronize(context)
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown syntax error'
        context.addError(message)
        this.synchronize(context)
      }
    }

    return {
      type: ASTNodeType.PROGRAM,
      body,
      line: firstToken?.line ?? 1,
      column: firstToken?.column ?? 1,
      diagnostics: context.getDiagnostics(),
    }
  }

  /**
   * Se recupera de un error delegando en el context la búsqueda de un punto seguro.
   */
  private synchronize(context: ParserContext): void {
    context.sync(() => this.rules.some((rule) => rule.canStart(context)))
  }

  /**
   * Intenta parsear una sentencia usando las reglas registradas.
   */
  public parseStatement(context: ParserContext): StatementNode[] {
    if (context.isAtEnd()) return []

    const startPos = context.getPosition()
    for (const rule of this.rules) {
      const nodes = rule.parse(context, this)
      if (nodes.length > 0 || context.getPosition() > startPos) return nodes
    }

    return []
  }
}
