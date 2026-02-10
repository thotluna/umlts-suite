import type { TokenMatcher } from '../matcher.types';
import type { LexerReader } from '../lexer.reader';
import type { Token } from '../token.types';
import { TokenType } from '../token.types';

export class CommentMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    if (reader.peek() !== '/') return null;

    const startLine = reader.getLine();
    const startColumn = reader.getColumn();
    const snap = reader.snapshot();

    reader.advance(); // consume /
    const next = reader.peek();

    if (next === '/') {
      let value = '//';
      reader.advance(); // consume /
      while (!reader.isAtEnd() && reader.peek() !== '\n') {
        value += reader.advance();
      }
      return { type: TokenType.COMMENT, value, line: startLine, column: startColumn };
    }

    if (next === '*') {
      let value = '/*';
      reader.advance(); // consume *

      const isDoc = reader.peek() === '*' && reader.peekNext() !== '/';
      const tokenType = isDoc ? TokenType.DOC_COMMENT : TokenType.COMMENT;

      while (!reader.isAtEnd()) {
        if (reader.peek() === '*' && reader.peekNext() === '/') {
          reader.advance(); // *
          reader.advance(); // /
          value += '*/';
          break;
        }
        const char = reader.advance();
        value += char;
      }
      return { type: tokenType, value, line: startLine, column: startColumn };
    }

    reader.rollback(snap);
    return null;
  }
}
