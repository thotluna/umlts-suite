import { Lexer } from './lexer';
import { WhitespaceMatcher } from './matchers/whitespace.matcher';
import { CommentMatcher } from './matchers/comment.matcher';
import { IdentifierMatcher } from './matchers/identifier.matcher';
import { NumberMatcher } from './matchers/number.matcher';
import { SymbolMatcher } from './matchers/symbol.matcher';
import { StringMatcher } from './matchers/string.matcher';

export class LexerFactory {
  /**
   * Crea una instancia del Lexer con la configuración estándar de UMLTS.
   */
  public static create(input: string): Lexer {
    const matchers = [
      new WhitespaceMatcher(),
      new CommentMatcher(),
      new IdentifierMatcher(),
      new NumberMatcher(),
      new StringMatcher(),
      new SymbolMatcher()
    ];

    return new Lexer(input, matchers);
  }
}
