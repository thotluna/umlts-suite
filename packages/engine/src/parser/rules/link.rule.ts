import { TokenType } from '@engine/syntax/token.types'
import { type StatementNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

export class LinkRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
    let i = 0
    if (context.lookahead(i).type !== TokenType.IDENTIFIER) return false
    i++
    while (context.lookahead(i).type === TokenType.DOT) {
      i++
      if (context.lookahead(i).type !== TokenType.IDENTIFIER) break
      i++
    }
    return context.lookahead(i).type === TokenType.RANGE
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    if (!this.canHandle(context)) return []
    const fromToken = context.consume(TokenType.IDENTIFIER, 'Expected origin identifier')

    let from = fromToken.value
    while (context.match(TokenType.DOT)) {
      from += '.' + context.consume(TokenType.IDENTIFIER, 'Expected identifier after .').value
    }

    context.consume(TokenType.RANGE, "Expected '..' anchor operator")

    const targets: string[] = []
    do {
      let target = context.consume(TokenType.IDENTIFIER, 'Expected target identifier').value
      while (context.match(TokenType.DOT)) {
        target += '.' + context.consume(TokenType.IDENTIFIER, 'Expected identifier after .').value
      }
      targets.push(target)
    } while (context.match(TokenType.COMMA))

    return [ASTFactory.createAnchor(from, targets, fromToken.line, fromToken.column)]
  }
}
