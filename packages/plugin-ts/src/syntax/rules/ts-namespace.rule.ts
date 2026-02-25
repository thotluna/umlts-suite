import { TokenType, ASTFactory } from '@umlts/engine'
import type { StatementNode, IParserHub, StatementRule, Orchestrator } from '@umlts/engine'

export class TSNamespaceRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
    return context.check(TokenType.KW_NAMESPACE)
  }

  public parse(context: IParserHub, orchestrator: Orchestrator): StatementNode[] {
    if (!context.check(TokenType.KW_NAMESPACE)) return []

    const startToken = context.consume(TokenType.KW_NAMESPACE, "Expected 'namespace'")
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Namespace name expected')

    const docs = context.consumePendingDocs()

    const hasLBrace = context.match(TokenType.LBRACE)
    if (!hasLBrace) {
      context.addError("Expected '{' after namespace name")
    }

    const body: StatementNode[] = []
    if (hasLBrace) {
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        const startPos = context.getPosition()
        const nodes = orchestrator.parseStatement(context)
        if (nodes.length > 0) {
          body.push(...nodes)
        } else if (context.getPosition() === startPos) {
          context.addError('Unrecognized statement inside namespace', context.peek())
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}' for namespace closing")
    }

    // A namespace is conceptually equivalent to a package in UMLTS
    return [
      ASTFactory.createPackage(nameToken.value, body, startToken.line, startToken.column, docs),
    ]
  }
}
