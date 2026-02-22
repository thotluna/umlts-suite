/**
 * LexerReader provides a low-level stream interface for reading characters
 * from an input string, while maintaining precise tracking of line and column positions.
 * It supports backtracking via snapshots for non-destructive look-ahead matching.
 */
export class LexerReader {
  private readonly input: string
  private position = 0
  private line = 1
  private column = 1

  constructor(input: string) {
    this.input = input
  }

  /**
   * Returns the character at the current position without advancing.
   * Returns an empty string if at the end of input.
   */
  public peek(): string {
    return this.input[this.position] ?? ''
  }

  /**
   * Returns the character after the current position without advancing.
   * Returns an empty string if there is no next character.
   */
  public peekNext(): string {
    return this.input[this.position + 1] ?? ''
  }

  /**
   * Returns the current character and moves the pointer forward.
   * Updates line and column tracking accordingly (line increments on '\n').
   */
  public advance(): string {
    const char = this.input[this.position++] ?? ''
    if (char === '\n') {
      this.line++
      this.column = 1
    } else {
      this.column++
    }
    return char
  }

  /**
   * Returns true if the pointer has reached the end of the input string.
   */
  public isAtEnd(): boolean {
    return this.position >= this.input.length
  }

  /**
   * Returns the current 1-based line number.
   */
  public getLine(): number {
    return this.line
  }

  /**
   * Returns the current 1-based column number.
   */
  public getColumn(): number {
    return this.column
  }

  /**
   * Returns the current absolute position in the input string.
   */
  public getPosition(): number {
    return this.position
  }

  /**
   * Captures the current state (position, line, column) to allow later backtracking.
   * Useful for matchers that need to "dry-run" a pattern.
   */
  public snapshot() {
    return {
      position: this.position,
      line: this.line,
      column: this.column,
    }
  }

  /**
   * Restores the reader state from a previously captured snapshot.
   */
  public rollback(snapshot: { position: number; line: number; column: number }) {
    this.position = snapshot.position
    this.line = snapshot.line
    this.column = snapshot.column
  }
}
