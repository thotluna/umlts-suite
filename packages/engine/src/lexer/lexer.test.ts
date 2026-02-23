import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { TokenType } from '@engine/syntax/token.types'

describe('Lexer', () => {
  describe('Basic Tokenization', () => {
    it('should tokenize a simple class declaration', () => {
      const input = 'class User'
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens).toHaveLength(3) // KW_CLASS, IDENTIFIER, EOF
      expect(tokens[0]).toMatchObject({ type: TokenType.KW_CLASS, value: 'class' })
      expect(tokens[1]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'User' })
      expect(tokens[2].type).toBe(TokenType.EOF)
    })

    it('should handle complex identifiers and numbers', () => {
      const input = 'My_Class_123 456'
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'My_Class_123' })
      expect(tokens[1]).toMatchObject({ type: TokenType.NUMBER, value: '456' })
    })

    it('should tokenize strings correctly', () => {
      const input = '"Double string" \'Single string\''
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens[0]).toMatchObject({ type: TokenType.STRING, value: 'Double string' })
      expect(tokens[1]).toMatchObject({ type: TokenType.STRING, value: 'Single string' })
    })
  })

  describe('Greedy Matching & Ambiguity', () => {
    it('should prefer long operators over short ones (Greedy Matching)', () => {
      const input = '>> >I >* >+ >- >< > <> .. .'
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens[0].type).toBe(TokenType.OP_INHERIT) // '>>' instead of '>' '>'
      expect(tokens[1].type).toBe(TokenType.OP_IMPLEMENT) // '>I'
      expect(tokens[2].type).toBe(TokenType.OP_COMP) // '>*'
      expect(tokens[3].type).toBe(TokenType.OP_AGREG) // '>+'
      expect(tokens[4].type).toBe(TokenType.OP_USE) // '>-'
      expect(tokens[5].type).toBe(TokenType.OP_ASSOC) // '><'
      expect(tokens[6].type).toBe(TokenType.GT) // '>'
      expect(tokens[7].type).toBe(TokenType.OP_ASSOC_BIDIR) // '<>'
      expect(tokens[8].type).toBe(TokenType.RANGE) // '..'
      expect(tokens[9].type).toBe(TokenType.DOT) // '.'
    })

    it('should correctly distinguish keywords from longer identifiers', () => {
      const input = 'classifier class package_name package'
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens[0]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'classifier' })
      expect(tokens[1]).toMatchObject({ type: TokenType.KW_CLASS, value: 'class' })
      expect(tokens[2]).toMatchObject({ type: TokenType.IDENTIFIER, value: 'package_name' })
      expect(tokens[3]).toMatchObject({ type: TokenType.KW_PACKAGE, value: 'package' })
    })
  })

  describe('Comments & Whitespace', () => {
    it('should handle whitespace and location tracking correctly', () => {
      const input = '  class\n   User  '
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens[0].line).toBe(1)
      expect(tokens[0].column).toBe(3) // After 2 spaces
      expect(tokens[1].line).toBe(2)
      expect(tokens[1].column).toBe(4) // After 3 spaces on line 2
    })

    it('should tokenize single and multi-line comments', () => {
      const input = '// line\n/* multi\nline */'
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens[0].type).toBe(TokenType.COMMENT)
      expect(tokens[1].type).toBe(TokenType.COMMENT)
      expect(tokens[1].line).toBe(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle unknown characters as UNKNOWN tokens', () => {
      const input = 'class §'
      const lexer = LexerFactory.create(input)
      const tokens = lexer.tokenize()

      expect(tokens[1].type).toBe(TokenType.UNKNOWN)
      expect(tokens[1].value).toBe('§')
    })
  })
})
