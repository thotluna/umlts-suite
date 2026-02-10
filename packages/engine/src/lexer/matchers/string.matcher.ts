import type { TokenMatcher } from '../matcher.types';
import type { LexerReader } from '../lexer.reader';
import type { Token } from '../token.types';
import { TokenType } from '../token.types';

export class StringMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    const char = reader.peek();

    if (char !== '"' && char !== "'") {
      return null;
    }

    const startLine = reader.getLine();
    const startColumn = reader.getColumn();
    const quote = reader.advance();
    let value = '';

    while (!reader.isAtEnd() && reader.peek() !== quote) {
      if (reader.peek() === '\\') {
        reader.advance();
        if (!reader.isAtEnd()) {
          value += reader.advance();
        }
      } else {
        value += reader.advance();
      }
    }

    if (!reader.isAtEnd()) {
      reader.advance(); // consume closing quote
    }

    return {
      type: TokenType.STRING,
      value: value,
      line: startLine,
      column: startColumn
    };
  }
}
