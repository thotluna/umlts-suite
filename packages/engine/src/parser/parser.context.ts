import { TokenType, type Token } from '../syntax/token.types'
import type { Diagnostic, DiagnosticCode } from '../syntax/diagnostic.types'
import { TokenStream } from './token-stream'
import { DiagnosticReporter } from './diagnostic-reporter'
import { DocRegistry } from './doc-registry'
import type { LanguagePlugin } from '../plugins/language-plugin'

/**
 * ParserContext: Fachada (Facade) que coordina los subsistemas del parser.
 * Delega la navegación a TokenStream, los errores a DiagnosticReporter y
 * la documentación a DocRegistry.
 */
export class ParserContext {
  private readonly stream: TokenStream
  private readonly errors: DiagnosticReporter
  private readonly docs: DocRegistry
  private readonly plugin?: LanguagePlugin

  constructor(tokens: Token[], errors: DiagnosticReporter, plugin?: LanguagePlugin) {
    this.stream = new TokenStream(tokens)
    this.errors = errors
    this.docs = new DocRegistry()
    this.plugin = plugin
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

    // Si no es el token esperado, damos una oportunidad al plugin para limpiar el camino
    if (this.handleUnexpectedToken()) {
      return this.consume(type, message)
    }

    throw new Error(`${message} at line ${this.peek().line}, column ${this.peek().column}`)
  }

  public softConsume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.consume(type, message)
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

  public consumeModifiers() {
    const modifiers = {
      isAbstract: false,
      isStatic: false,
      isActive: false,
      isLeaf: false,
      isFinal: false,
      isRoot: false,
    }

    let found = true
    while (found) {
      found = false
      if (this.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT)) {
        modifiers.isAbstract = true
        found = true
      }
      if (this.match(TokenType.MOD_STATIC, TokenType.KW_STATIC)) {
        modifiers.isStatic = true
        found = true
      }
      if (this.match(TokenType.MOD_ACTIVE, TokenType.KW_ACTIVE)) {
        modifiers.isActive = true
        found = true
      }
      if (this.match(TokenType.MOD_LEAF, TokenType.KW_LEAF)) {
        modifiers.isLeaf = true
        found = true
      }
      if (this.match(TokenType.KW_FINAL)) {
        modifiers.isFinal = true
        found = true
      }
      if (this.match(TokenType.MOD_ROOT, TokenType.KW_ROOT)) {
        modifiers.isRoot = true
        found = true
      }
    }
    return modifiers
  }

  /**
   * Sincroniza el stream avanzando hasta encontrar un punto seguro (un delimitador o el inicio de una regla).
   * @param isPointOfNoReturn - Predicado que define si el token actual permite iniciar un nuevo parseo seguro.
   */
  public sync(isPointOfNoReturn: () => boolean): void {
    if (this.isAtEnd()) return

    // Avanzamos al menos uno para salir del token problemático
    this.advance()

    while (!this.isAtEnd()) {
      // Puntos seguros de sincronización:
      // 1. Después de un bloque (})
      if (this.prev().type === TokenType.RBRACE) return

      // 2. El inicio de una sentencia reconocida por el orquestador
      if (isPointOfNoReturn()) return

      this.advance()
    }
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

  /**
   * Delegates to the plugin if a token is not recognized or expected by the core rules.
   */
  public handleUnexpectedToken(): boolean {
    if (this.plugin?.handleUnexpectedToken) {
      return this.plugin.handleUnexpectedToken(this, this.peek())
    }
    return false
  }
}
