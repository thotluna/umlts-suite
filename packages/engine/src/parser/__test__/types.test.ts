import { describe, it, expect } from 'vitest'
import { ParserFactory } from '@engine/parser/parser.factory'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { type EntityNode, type AttributeNode } from '@engine/syntax/nodes'

describe('TypeRule', () => {
  it('should parse simple types', () => {
    const input = 'class A { attr: string }'
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)

    const entity = program.body[0] as EntityNode
    const attr = entity.body![0] as AttributeNode
    expect(attr.typeAnnotation.raw).toBe('string')
  })

  it('should parse generic types', () => {
    const input = 'class A { attr: List<string> }'
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)

    const entity = program.body[0] as EntityNode
    const attr = entity.body![0] as AttributeNode
    expect(attr.typeAnnotation.raw).toBe('List<string>')
  })

  it('should parse nested generic types', () => {
    const input = 'class A { attr: Map<string, List<number>> }'
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)

    const entity = program.body[0] as EntityNode
    const attr = entity.body![0] as AttributeNode
    expect(attr.typeAnnotation.raw).toBe('Map<string, List<number>>')
  })

  it('should parse array types', () => {
    const input = 'class A { attr: string[] }'
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)

    const entity = program.body[0] as EntityNode
    const attr = entity.body![0] as AttributeNode
    expect(attr.typeAnnotation.raw).toBe('string')
    expect(attr.multiplicity).toBe('[]')
  })
})
