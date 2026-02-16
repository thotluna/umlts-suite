import type { Token } from '../lexer/token.types'
import { TokenType } from '../lexer/token.types'
import type { Diagnostic, DiagnosticCode } from './diagnostic.types'
import { DiagnosticSeverity } from './diagnostic.types'

export class ParserContext {
  private readonly tokens: Token[]
  private current = 0
  private readonly diagnostics: Diagnostic[] = []
  private splitTokens: Token[] = []

  constructor(tokens: Token[]) {
    this.tokens = tokens
  }

  public peek(): Token {
    if (this.splitTokens.length > 0) {
      return this.splitTokens[0]
    }
    if (this.current >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]
    }
    return this.tokens[this.current]
  }

  public peekNext(): Token {
    if (this.splitTokens.length > 1) {
      return this.splitTokens[1]
    }
    const offset = this.splitTokens.length === 1 ? 0 : 1
    if (this.current + offset >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]
    }
    return this.tokens[this.current + offset]
  }

  public prev(): Token {
    return this.tokens[this.current - 1]
  }

  public advance(): Token {
    if (this.splitTokens.length > 0) {
      return this.splitTokens.shift()!
    }
    if (!this.isAtEnd()) this.current++
    return this.prev()
  }

  public getPosition(): number {
    return this.current
  }

  public rollback(position: number): void {
    this.current = position
  }

  public isAtEnd(): boolean {
    return this.splitTokens.length === 0 && this.peek().type === TokenType.EOF
  }

  // -------------------------

  public check(type: TokenType): boolean {
    if (this.isAtEnd()) return false
    const token = this.peek()
    if (token.type === type) return true

    // Si buscamos un carácter individual y tenemos uno compuesto que empieza con él
    if (token.type === TokenType.OP_INHERIT && type === TokenType.GT) {
      return true
    }

    return false
  }

  public checkAny(...types: TokenType[]): boolean {
    return types.some((type) => this.check(type))
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

  public match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        const token = this.peek()
        if (token.type === TokenType.OP_INHERIT && type === TokenType.GT) {
          this.current++ // consume >> real
          this.splitTokens.push({
            ...token,
            type: TokenType.GT,
            value: '>',
            column: token.column + 1,
          })
          // We don't return the split token here, just return true
          // The caller will then call advance() (implied) or we just return true
          // Wait, match() SHOULD consume the token.
          // By incrementing this.current and pushing to splitTokens, we effectively
          // consumed the first half of >>.
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
      const token = this.peek()
      if (token.type === TokenType.OP_INHERIT && type === TokenType.GT) {
        this.current++ // consume >> real
        this.splitTokens.push({
          ...token,
          type: TokenType.GT,
          value: '>',
          column: token.column + 1,
        })
        return { ...token, type: TokenType.GT, value: '>' }
      }
      return this.advance()
    }

    throw new Error(`${message} at line ${this.peek().line}, column ${this.peek().column}`)
  }

  /**
   * Intenta consumir un token. Si no existe, registra el error pero devuelve un token sintético
   * para permitir que la regla continúe (Error Tolerance).
   */
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

  /**
   * Sincroniza el stream después de un error, saltando tokens hasta un punto seguro.
   * Encapsula el conocimiento de los tokens (ej. RBRACE) para liberar al orquestador.
   * @param canStartNew Función que determina si el estado actual permite iniciar una nueva sentencia.
   */
  public sync(canStartNew: () => boolean): void {
    this.advance()

    while (!this.isAtEnd()) {
      // Punto seguro: el token anterior cerró un bloque
      if (this.prev().type === TokenType.RBRACE) return
      // Punto seguro: alguna regla puede empezar aquí
      if (canStartNew()) return

      this.advance()
    }
  }

  // -------------------------

  public addError(message: string, token?: Token, code?: DiagnosticCode): void {
    this.addDiagnostic(message, DiagnosticSeverity.ERROR, token, code)
  }

  public addWarning(message: string, token?: Token, code?: DiagnosticCode): void {
    this.addDiagnostic(message, DiagnosticSeverity.WARNING, token, code)
  }

  public addInfo(message: string, token?: Token, code?: DiagnosticCode): void {
    this.addDiagnostic(message, DiagnosticSeverity.INFO, token, code)
  }

  public addDiagnostic(
    message: string,
    severity: DiagnosticSeverity,
    token?: Token,
    code?: DiagnosticCode,
  ): void {
    const errorToken = token ?? this.peek()
    this.diagnostics.push({
      message,
      code,
      line: errorToken.line,
      column: errorToken.column,
      length: errorToken.value.length || 1,
      severity,
    })
  }

  public getDiagnostics(): Diagnostic[] {
    return this.diagnostics
  }

  public hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === DiagnosticSeverity.ERROR)
  }

  // -------------------------

  private pendingDocs: string | undefined

  public setPendingDocs(docs: string): void {
    this.pendingDocs = docs
  }

  public consumePendingDocs(): string | undefined {
    const docs = this.pendingDocs
    this.pendingDocs = undefined
    return docs
  }
}
