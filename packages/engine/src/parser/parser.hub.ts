import { TokenType, type Token } from '../syntax/token.types'
import type { Diagnostic, DiagnosticCode } from '../syntax/diagnostic.types'
import { TokenStream } from './token-stream'
import { DiagnosticReporter } from './diagnostic-reporter'
import { DocRegistry } from './doc-registry'
import type { IParserHub } from './parser.context'

/**
 * ParserHub: Fachada (Facade) que coordina los subsistemas del parser.
 * Implementa IParserHub para desacoplar a los consumidores de la implementación.
 */
export class ParserHub implements IParserHub {
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
    return this.stream.checkAny(...types)
  }

  // --- Lógica de coordinación (Facade Logic) ---

  public match(...types: TokenType[]): boolean {
    return this.stream.takeAny(...types) !== null
  }

  public consume(type: TokenType, message: string): Token {
    const token = this.stream.tryTake(type)
    if (token) return token

    throw new Error(`${message} at line ${this.peek().line}, column ${this.peek().column}`)
  }

  public softConsume(type: TokenType, message: string): Token {
    const token = this.stream.tryTake(type)
    if (token) return token

    this.addError(message)
    return this.stream.createMissingToken(type)
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
