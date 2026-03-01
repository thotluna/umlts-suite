import { TokenType } from '@engine/syntax/token.types'
import { type StatementNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { StatementRule, Orchestrator } from '@engine/parser/rule.types'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

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
    if (context.check(TokenType.KW_CONFIG)) return true
    if (context.check(TokenType.AT)) {
      // Solo manejamos @ si es un par clave-valor (ej: @key: value)
      // para evitar colisiones con los estereotipos.
      const next = context.lookahead(1)
      const afterNext = context.lookahead(2)
      return next.type === TokenType.IDENTIFIER && afterNext.type === TokenType.COLON
    }
    return false
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
    } else {
      const val = context.consume(TokenType.IDENTIFIER, 'Expected configuration value.').value
      if (val === 'true') return true
      if (val === 'false') return false
      return val
    }
  }
}
