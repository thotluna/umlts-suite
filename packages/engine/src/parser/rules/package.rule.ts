import { TokenType } from '../../lexer/token.types'
import type { StatementNode, PackageNode } from '../ast/nodes'
import { ASTNodeType } from '../ast/nodes'
import type { ParserContext } from '../parser.context'
import type { StatementRule, Orchestrator } from '../rule.types'

export class PackageRule implements StatementRule {
  public parse(context: ParserContext, orchestrator: Orchestrator): PackageNode | null {
    if (!context.check(TokenType.KW_PACKAGE)) return null

    const startToken = context.consume(TokenType.KW_PACKAGE, "Expected 'package'")
    const nameToken = context.consume(TokenType.IDENTIFIER, 'Package name expected')

    context.consume(TokenType.LBRACE, "Expected '{' after package name")

    const body: StatementNode[] = []
    while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
      const stmt = orchestrator.parseStatement(context)
      if (stmt != null) {
        if (Array.isArray(stmt)) {
          body.push(...stmt)
        } else {
          body.push(stmt)
        }
      } else {
        // Si no hay match y no es fin de bloque, algo va mal.
        // Por ahora avanzamos para evitar bucle infinito.
        context.advance()
      }
    }

    context.consume(TokenType.RBRACE, "Expected '}' for package closing")

    return {
      type: ASTNodeType.PACKAGE,
      name: nameToken.value,
      body,
      line: startToken.line,
      column: startToken.column,
    }
  }
}
