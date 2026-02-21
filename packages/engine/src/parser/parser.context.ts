import { TokenType, type Token } from '../syntax/token.types'
import type { Diagnostic, DiagnosticCode } from '../syntax/diagnostic.types'
import { TokenStream } from './token-stream'
import { DiagnosticReporter } from './diagnostic-reporter'
import { DocRegistry } from './doc-registry'

/**
 * ParserContext: Fachada (Facade) que coordina los subsistemas del parser.
 * Delega la navegación a TokenStream, los errores a DiagnosticReporter y
 * la documentación a DocRegistry.
 */
export class ParserContext {
  private readonly stream: TokenStream
  private readonly errors: DiagnosticReporter
  private readonly docs: DocRegistry

  constructor(tokens: Token[], errors: DiagnosticReporter) {
    this.stream = new TokenStream(tokens)
    this.errors = errors
    this.docs = new DocRegistry()
  }

  // --- Delegación a TokenStream ---

  public peek(): Token {
    return this.stream.peek()
  }

  public peekNext(): Token {
    return this.stream.peekNext()
  }

  public prev(): Token {
    return this.stream.prev()
  }

  public advance(): Token {
    return this.stream.advance()
  }

  public getPosition(): number {
    return this.stream.getPosition()
  }

  public rollback(position: number): void {
    this.stream.rollback(position)
  }

  public isAtEnd(): boolean {
    return this.stream.isAtEnd()
  }

  public check(type: TokenType): boolean {
    return this.stream.check(type)
  }

  public checkAny(...types: TokenType[]): boolean {
    return types.some((type) => this.check(type))
  }

  // --- Lógica de coordinación (Facade Logic) ---

  public match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        // Si el stream necesita dividir el token, lo hace y devuelve true
        if (this.stream.splitAndAdvance(type)) {
          return true
        }
        this.advance()
        return true
      }
    }
    return false
  }

  public consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      if (this.stream.splitAndAdvance(type)) {
        return { ...this.stream.prev(), type, value: '>' } // Casos especiales de splitting
      }
      return this.advance()
    }

    throw new Error(`${message} at line ${this.peek().line}, column ${this.peek().column}`)
  }

  public softConsume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      if (this.stream.splitAndAdvance(type)) {
        return { ...this.stream.prev(), type, value: '>' } // Casos especiales de splitting
      }
      return this.advance()
    }

    const token = this.peek()
    this.addError(message, token)
    return {
      type,
      value: `<missing:${type}>`,
      line: token.line,
      column: token.column,
    }
  }

  /**
   * Sincroniza el stream delegando en TokenStream.
   * @param isPointOfNoReturn - Predicado que define si el token actual permite iniciar un nuevo parseo seguro.
   */
  public sync(isPointOfNoReturn: () => boolean): void {
    this.stream.sync(isPointOfNoReturn)
  }

  // --- Delegación a DiagnosticReporter ---

  public addError(message: string, token?: Token, code?: DiagnosticCode): void {
    this.errors.addError(message, token ?? this.peek(), code)
  }

  public addWarning(message: string, token?: Token, code?: DiagnosticCode): void {
    this.errors.addWarning(message, token ?? this.peek(), code)
  }

  public addInfo(message: string, token?: Token, code?: DiagnosticCode): void {
    this.errors.addInfo(message, token ?? this.peek(), code)
  }

  public getDiagnostics(): Diagnostic[] {
    return this.errors.getDiagnostics()
  }

  public hasErrors(): boolean {
    return this.errors.hasErrors()
  }

  // --- Delegación a DocRegistry ---

  public setPendingDocs(docs: string): void {
    this.docs.setPendingDocs(docs)
  }

  public consumePendingDocs(): string | undefined {
    return this.docs.consumePendingDocs()
  }
}
