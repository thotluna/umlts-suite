import { describe, expect, it } from 'vitest'
import { LexerReader } from '@engine/lexer/lexer.reader'

describe('LexerReader', () => {
  describe('Basic Navigation', () => {
    it('should peek current character without advancing', () => {
      const reader = new LexerReader('abc')
      expect(reader.peek()).toBe('a')
      expect(reader.getPosition()).toBe(0)
    })

    it('should peek next character without advancing', () => {
      const reader = new LexerReader('abc')
      expect(reader.peekNext()).toBe('b')
      expect(reader.getPosition()).toBe(0)
    })

    it('should advance and return current character', () => {
      const reader = new LexerReader('abc')
      expect(reader.advance()).toBe('a')
      expect(reader.getPosition()).toBe(1)
      expect(reader.peek()).toBe('b')
    })

    it('should identify end of input', () => {
      const reader = new LexerReader('a')
      expect(reader.isAtEnd()).toBe(false)
      reader.advance()
      expect(reader.isAtEnd()).toBe(true)
    })

    it('should return empty string on peek or advance past end', () => {
      const reader = new LexerReader('')
      expect(reader.peek()).toBe('')
      expect(reader.advance()).toBe('')
      expect(reader.isAtEnd()).toBe(true)
    })
  })

  describe('Location Tracking', () => {
    it('should increment column on normal characters', () => {
      const reader = new LexerReader('abc')
      expect(reader.getColumn()).toBe(1)
      reader.advance() // 'a'
      expect(reader.getColumn()).toBe(2)
      reader.advance() // 'b'
      expect(reader.getColumn()).toBe(3)
    })

    it('should increment line and reset column on newline', () => {
      const reader = new LexerReader('a\nb')
      reader.advance() // 'a'
      expect(reader.getLine()).toBe(1)
      expect(reader.getColumn()).toBe(2)

      reader.advance() // '\n'
      expect(reader.getLine()).toBe(2)
      expect(reader.getColumn()).toBe(1)

      reader.advance() // 'b'
      expect(reader.getLine()).toBe(2)
      expect(reader.getColumn()).toBe(2)
    })
  })

  describe('Snapshot and Rollback', () => {
    it('should save and restore state correctly', () => {
      const reader = new LexerReader('abc\ndef')

      // Advance to some position
      reader.advance() // 'a'
      reader.advance() // 'b'
      reader.advance() // 'c'
      reader.advance() // '\n'

      const snapshot = reader.snapshot()
      expect(snapshot.position).toBe(4)
      expect(snapshot.line).toBe(2)
      expect(snapshot.column).toBe(1)

      // Advance further
      reader.advance() // 'd'
      reader.advance() // 'e'
      expect(reader.getPosition()).toBe(6)
      expect(reader.getLine()).toBe(2)
      expect(reader.getColumn()).toBe(3)

      // Rollback
      reader.rollback(snapshot)
      expect(reader.getPosition()).toBe(4)
      expect(reader.getLine()).toBe(2)
      expect(reader.getColumn()).toBe(1)
      expect(reader.peek()).toBe('d')
    })
  })
})
