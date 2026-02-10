import type { Token } from './token.types';
import { TokenType } from './token.types';
import { LexerReader } from './lexer.reader';
import type { TokenMatcher } from './matcher.types';

export class Lexer {
  private reader: LexerReader;
  private matchers: TokenMatcher[];

  constructor(input: string, matchers: TokenMatcher[]) {
    this.reader = new LexerReader(input);
    this.matchers = matchers;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.reader.isAtEnd()) {
      let matched = false;
      const beforePos = this.reader.getPosition();
      let token: Token | null = null;

      for (const matcher of this.matchers) {
        token = matcher.match(this.reader);

        // Un match ocurre si devolvió un token O si avanzó el puntero (ej. espacios)
        if (token || this.reader.getPosition() > beforePos) {
          matched = true;
          break;
        }
      }

      if (token) {
        tokens.push(token);
      } else if (!matched) {
        // Carácter desconocido: solo avanzamos si nadie reclamó el carácter
        const startLine = this.reader.getLine();
        const startColumn = this.reader.getColumn();
        tokens.push({
          type: TokenType.UNKNOWN,
          value: this.reader.advance(),
          line: startLine,
          column: startColumn
        });
      }
    }

    tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.reader.getLine(),
      column: this.reader.getColumn()
    });

    return tokens;
  }
}
