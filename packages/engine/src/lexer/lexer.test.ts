import { describe, it, expect } from 'vitest';
import { LexerFactory } from './lexer.factory';
import { TokenType } from './token.types';

describe('Lexer', () => {
  it('should tokenize a simple class declaration', () => {
    const input = 'class User';
    const lexer = LexerFactory.create(input);
    const tokens = lexer.tokenize();

    expect(tokens).toHaveLength(3); // KW_CLASS, IDENTIFIER, EOF

    expect(tokens[0]).toMatchObject({
      type: TokenType.KW_CLASS,
      value: 'class',
      line: 1,
      column: 1
    });

    expect(tokens[1]).toMatchObject({
      type: TokenType.IDENTIFIER,
      value: 'User',
      line: 1,
      column: 7
    });

    expect(tokens[2]!.type).toBe(TokenType.EOF);
  });

  it('should handle whitespace correctly', () => {
    const input = '  class   User  ';
    const lexer = LexerFactory.create(input);
    const tokens = lexer.tokenize();

    expect(tokens).toHaveLength(3);
    expect(tokens[0]!.type).toBe(TokenType.KW_CLASS);
    expect(tokens[1]!.type).toBe(TokenType.IDENTIFIER);
  });

  it('should tokenize relations and symbols correctly', () => {
    const input = '>> >I >* >+ >- >';
    const lexer = LexerFactory.create(input);
    const tokens = lexer.tokenize();

    expect(tokens[0]!.type).toBe(TokenType.OP_INHERIT);
    expect(tokens[1]!.type).toBe(TokenType.OP_IMPLEMENT);
    expect(tokens[2]!.type).toBe(TokenType.OP_COMP);
    expect(tokens[3]!.type).toBe(TokenType.OP_AGREG);
    expect(tokens[4]!.type).toBe(TokenType.OP_USE);
    expect(tokens[5]!.type).toBe(TokenType.OP_GENERIC_REL);
  });

  it('should tokenize braces and other symbols', () => {
    const input = '{ } ( ) [ ] : , . .. | * + - # ~ $';
    const lexer = LexerFactory.create(input);
    const tokens = lexer.tokenize();

    const expectedTypes = [
      TokenType.LBRACE, TokenType.RBRACE,
      TokenType.LPAREN, TokenType.RPAREN,
      TokenType.LBRACKET, TokenType.RBRACKET,
      TokenType.COLON, TokenType.COMMA, TokenType.DOT, TokenType.RANGE,
      TokenType.PIPE, TokenType.MOD_ABSTRACT,
      TokenType.VIS_PUB, TokenType.VIS_PRIV, TokenType.VIS_PROT, TokenType.VIS_PACK,
      TokenType.MOD_STATIC
    ];

    expectedTypes.forEach((type, i) => {
      expect(tokens[i]!.type).toBe(type);
    });
  });

  it('should tokenize single-line comments', () => {
    const input = 'class User // This is a user class';
    const lexer = LexerFactory.create(input);
    const tokens = lexer.tokenize();

    expect(tokens).toHaveLength(4); // KW_CLASS, IDENTIFIER, COMMENT, EOF
    expect(tokens[2]!.type).toBe(TokenType.COMMENT);
    expect(tokens[2]!.value).toBe('// This is a user class');
  });

  it('should tokenize multi-line comments', () => {
    const input = '/* Multi-line\n   comment */ class User';
    const lexer = LexerFactory.create(input);
    const tokens = lexer.tokenize();

    expect(tokens).toHaveLength(4); // COMMENT, KW_CLASS, IDENTIFIER, EOF
    expect(tokens[0]!.type).toBe(TokenType.COMMENT);
    expect(tokens[0]!.line).toBe(1);
    expect(tokens[1]!.line).toBe(2); // class should be on line 2
  });
});
