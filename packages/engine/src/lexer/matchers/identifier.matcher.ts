import type { TokenMatcher } from '../matcher.types';
import type { LexerReader } from '../lexer.reader';
import type { Token } from '../token.types';
import { TokenType } from '../token.types';

export class IdentifierMatcher implements TokenMatcher {
  private readonly KEYWORDS: Record<string, TokenType> = {
    'class': TokenType.KW_CLASS,
    'interface': TokenType.KW_INTERFACE,
    'enum': TokenType.KW_ENUM,
    'package': TokenType.KW_PACKAGE,
    'public': TokenType.KW_PUBLIC,
    'private': TokenType.KW_PRIVATE,
    'protected': TokenType.KW_PROTECTED,
    'internal': TokenType.KW_INTERNAL,
    'static': TokenType.KW_STATIC,
    'abstract': TokenType.KW_ABSTRACT,
    'active': TokenType.KW_ACTIVE,
  };

  public match(reader: LexerReader): Token | null {
    const char = reader.peek();
    if (!this.isAlpha(char) && char !== '_') return null;

    const startLine = reader.getLine();
    const startColumn = reader.getColumn();
    let value = '';

    while (!reader.isAtEnd() && (this.isAlphaNumeric(reader.peek()) || reader.peek() === '_' || reader.peek() === '.')) {
      value += reader.advance();
    }

    const type = this.KEYWORDS[value] || TokenType.IDENTIFIER;

    return { type, value, line: startLine, column: startColumn };
  }

  private isAlpha(char: string): boolean {
    return /[\p{L}]/u.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[\p{L}\p{N}]/u.test(char);
  }
}
