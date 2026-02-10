export class LexerReader {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  public peek(): string {
    return this.input[this.position] ?? '';
  }

  public peekNext(): string {
    return this.input[this.position + 1] ?? '';
  }

  public advance(): string {
    const char = this.input[this.position++] ?? '';
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  public isAtEnd(): boolean {
    return this.position >= this.input.length;
  }

  public getLine(): number { return this.line; }
  public getColumn(): number { return this.column; }
  public getPosition(): number { return this.position; }

  /**
   * Permite a los matchers "probar" una cadena sin consumir permanentemente los caracteres
   * si no hay coincidencia.
   */
  public snapshot() {
    return {
      position: this.position,
      line: this.line,
      column: this.column
    };
  }

  public rollback(snapshot: { position: number, line: number, column: number }) {
    this.position = snapshot.position;
    this.line = snapshot.line;
    this.column = snapshot.column;
  }
}
