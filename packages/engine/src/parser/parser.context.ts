import type { Token } from '../lexer/token.types';
import { TokenType } from '../lexer/token.types';
import type { Diagnostic } from './diagnostic.types';
import { DiagnosticSeverity } from './diagnostic.types';

export class ParserContext {
  private tokens: Token[];
  private current: number = 0;
  private diagnostics: Diagnostic[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public peek(): Token {
    return this.tokens[this.current]!;
  }

  public prev(): Token {
    return this.tokens[this.current - 1]!;
  }

  public advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.prev();
  }

  public check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  public match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  public consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} en línea ${this.peek().line}, columna ${this.peek().column}`);
  }

  public isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  public getPosition(): number {
    return this.current;
  }

  public rollback(position: number): void {
    this.current = position;
  }

  public addError(message: string, token?: Token): void {
    const errorToken = token || this.peek();
    this.diagnostics.push({
      message,
      line: errorToken.line,
      column: errorToken.column,
      severity: DiagnosticSeverity.ERROR
    });
  }

  public getDiagnostics(): Diagnostic[] {
    return this.diagnostics;
  }

  public hasErrors(): boolean {
    return this.diagnostics.some(d => d.severity === DiagnosticSeverity.ERROR);
  }

  private pendingDocs: string | undefined;

  public setPendingDocs(docs: string): void {
    this.pendingDocs = docs;
  }

  public consumePendingDocs(): string | undefined {
    const docs = this.pendingDocs;
    this.pendingDocs = undefined;
    return docs;
  }
}
