import { describe, it, expect } from 'vitest'
import { ParserFactory } from '../parser.factory'
import { LexerFactory } from '../../lexer/lexer.factory'
import { ASTNodeType, type EntityNode, type AttributeNode } from '../../syntax/nodes'

describe('EntityRule', () => {
  it('should parse an enum with literals and comments', () => {
    const input = `
      enum Color {
        RED,
        // The color of the sky
        BLUE,
        /* The color of
           grass */
        GREEN
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const entity = ast.body[0] as EntityNode
    expect(entity.type).toBe(ASTNodeType.ENUM)
    expect(entity.body).toBeDefined()
    expect(entity.body).toHaveLength(5) // RED, comment, BLUE, comment, GREEN
    expect((entity.body![0] as AttributeNode).name).toBe('RED')
    expect((entity.body![4] as AttributeNode).name).toBe('GREEN')
  })

  it('should parse an interface with type parameters', () => {
    const input = 'interface Repository<T, ID> {}'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const entity = ast.body[0] as EntityNode
    expect(entity.type).toBe(ASTNodeType.INTERFACE)
    expect(entity.typeParameters).toEqual(['T', 'ID'])
  })

  it('should parse active and abstract modifiers in different positions', () => {
    const input = `
      active class A {}
      class * B {}
      * class C {}
      & class D {}
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect((ast.body[0] as EntityNode).isActive).toBe(true)
    expect((ast.body[1] as EntityNode).isAbstract).toBe(true)
    expect((ast.body[2] as EntityNode).isAbstract).toBe(true)
    expect((ast.body[3] as EntityNode).isActive).toBe(true)
  })
})
