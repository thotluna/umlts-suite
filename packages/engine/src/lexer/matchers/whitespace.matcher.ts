import type { TokenMatcher } from '../matcher.types';
import type { LexerReader } from '../lexer.reader';
import type { Token } from '../token.types';

export class WhitespaceMatcher implements TokenMatcher {
  public match(reader: LexerReader): Token | null {
    const char = reader.peek();
    if (!/\s/.test(char)) return null;

    while (!reader.isAtEnd() && /\s/.test(reader.peek())) {
      reader.advance();
    }

    // El matcher de espacios consume pero no devuelve un Token (lo ignora el Lexer principal)
    return null;
  }
}
