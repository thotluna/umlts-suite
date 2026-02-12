import { TokenType } from '../../lexer/token.types';
import type { ConfigNode } from '../ast/nodes';
import { ASTNodeType } from '../ast/nodes';
import type { ParserContext } from '../parser.context';
import type { StatementRule } from '../rule.types';

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
  public parse(context: ParserContext): ConfigNode | null {
    if (!context.check(TokenType.KW_CONFIG)) {
      return null;
    }

    const configToken = context.consume(TokenType.KW_CONFIG, "Expected 'config' keyword.");
    context.consume(TokenType.LBRACE, "Expected '{' after 'config'.");

    const options: Record<string, any> = {};

    while (!context.isAtEnd() && !context.check(TokenType.RBRACE)) {
      // Allow optional commas or just newlines
      if (context.match(TokenType.COMMA)) continue;

      const keyToken = context.consume(TokenType.IDENTIFIER, "Expected configuration key.");
      context.consume(TokenType.COLON, "Expected ':' after key.");

      let value: any;
      if (context.check(TokenType.STRING)) {
        value = context.consume(TokenType.STRING, "").value;
      } else if (context.check(TokenType.NUMBER)) {
        value = Number(context.consume(TokenType.NUMBER, "").value);
      } else if (context.match(TokenType.KW_PUBLIC, TokenType.KW_PRIVATE, TokenType.KW_PROTECTED, TokenType.KW_INTERNAL)) {
        // Some keywords might be used as values (like visibility)
        value = context.prev().value;
      } else {
        // Default to identifier value as string
        value = context.consume(TokenType.IDENTIFIER, "Expected configuration value.").value;
      }

      options[keyToken.value] = value;
    }

    context.consume(TokenType.RBRACE, "Expected '}' at the end of config block.");

    return {
      type: ASTNodeType.CONFIG,
      options,
      line: configToken.line,
      column: configToken.column
    };
  }
}
