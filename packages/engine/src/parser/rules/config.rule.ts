import { TokenType } from '../../syntax/token.types'
import { type StatementNode } from '../../syntax/nodes'
import type { IParserHub } from '../core/parser.hub'
import type { StatementRule, Orchestrator } from '../rule.types'
import { ASTFactory } from '../factory/ast.factory'

/**
 * ConfigRule: Parses the 'config { ... }' block.
 *
 * Syntax:
 * config {
 *   key: value,
 *   another: "string",
 *   val: 123
 * }
 */
export class ConfigRule implements StatementRule {
  public canHandle(context: IParserHub): boolean {
    return context.check(TokenType.KW_CONFIG) || context.check(TokenType.AT)
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StatementNode[] {
    // 1. Sintaxis de bloque: config { ... }
    if (context.match(TokenType.KW_CONFIG)) {
      const configToken = context.prev()
      context.consume(TokenType.LBRACE, "Expected '{' after 'config'.")
      const options = this.parseBlockOptions(context)
      context.consume(TokenType.RBRACE, "Expected '}' at the end of config block.")

      return [ASTFactory.createConfig(options, configToken.line, configToken.column)]
    }

    // 2. Sintaxis de línea: @key: value
    if (context.match(TokenType.AT)) {
      const atToken = context.prev()
      const keyToken = context.consume(TokenType.IDENTIFIER, 'Expected configuration key after @.')
      context.consume(TokenType.COLON, "Expected ':' after key.")
      const value = this.parseValue(context)

      return [ASTFactory.createConfig({ [keyToken.value]: value }, atToken.line, atToken.column)]
    }

    return []
  }

  private parseBlockOptions(context: IParserHub): Record<string, unknown> {
    const options: Record<string, unknown> = {}
    while (!context.isAtEnd() && !context.check(TokenType.RBRACE)) {
      if (context.match(TokenType.COMMA)) continue

      const keyToken = context.consume(TokenType.IDENTIFIER, 'Expected configuration key.')
      context.consume(TokenType.COLON, "Expected ':' after key.")
      options[keyToken.value] = this.parseValue(context)
    }
    return options
  }

  private parseValue(context: IParserHub): unknown {
    if (context.check(TokenType.STRING)) {
      return context.consume(TokenType.STRING, '').value
    } else if (context.check(TokenType.NUMBER)) {
      return Number(context.consume(TokenType.NUMBER, '').value)
    } else if (
      context.match(
        TokenType.KW_PUBLIC,
        TokenType.KW_PRIVATE,
        TokenType.KW_PROTECTED,
        TokenType.KW_INTERNAL,
      )
    ) {
      return context.prev().value
    } else {
      const val = context.consume(TokenType.IDENTIFIER, 'Expected configuration value.').value
      if (val === 'true') return true
      if (val === 'false') return false
      return val
    }
  }
}
