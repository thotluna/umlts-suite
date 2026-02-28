import type { LexerReader } from '@engine/lexer/lexer.reader'
import type { Token } from '@engine/syntax/token.types'
import { TokenType } from '@engine/syntax/token.types'
import { BaseAlphaMatcher } from '@engine/lexer/matchers/base.alpha.matcher'

/**
 * Matches identifiers and classifies them as Keywords if they match.
 */
export class GeneralIdentifierMatcher extends BaseAlphaMatcher {
  private readonly KEYWORDS: Record<string, TokenType> = {
    class: TokenType.KW_CLASS,
    interface: TokenType.KW_INTERFACE,
    enum: TokenType.KW_ENUM,
    package: TokenType.KW_PACKAGE,
    public: TokenType.KW_PUBLIC,
    private: TokenType.KW_PRIVATE,
    protected: TokenType.KW_PROTECTED,
    internal: TokenType.KW_INTERNAL,
    static: TokenType.KW_STATIC,
    abstract: TokenType.KW_ABSTRACT,
    active: TokenType.KW_ACTIVE,
    config: TokenType.KW_CONFIG,
    leaf: TokenType.KW_LEAF,
    final: TokenType.KW_FINAL,
    root: TokenType.KW_ROOT,
    xor: TokenType.KW_XOR,
    note: TokenType.KW_NOTE,
    derived: TokenType.KW_DERIVED,
    async: TokenType.KW_ASYNC,
    profile: TokenType.KW_PROFILE,
    stereotype: TokenType.KW_STEREOTYPE,
    extends: TokenType.KW_EXTENDS,
  }

  public match(reader: LexerReader): Token | null {
    const startLine = reader.getLine()
    const startColumn = reader.getColumn()
    const value = this.readFullIdentifier(reader)
    if (value === null) return null

    const type = this.KEYWORDS[value] || TokenType.IDENTIFIER

    return { type, value, line: startLine, column: startColumn }
  }
}
