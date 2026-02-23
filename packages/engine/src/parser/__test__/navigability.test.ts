import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import {
  type EntityNode,
  type AttributeNode,
  type MethodNode,
  type RelationshipNode,
} from '@engine/parser/ast/nodes'

describe('Relationship Navigability', () => {
  it('should parse composition operators with default and explicit navigability', () => {
    const input = `
      A >* B
      C >*| D
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(2)

    const rel1 = ast.body[0] as RelationshipNode
    expect(rel1.kind).toBe('>*')
    expect(rel1.isNavigable).toBe(true)

    const rel2 = ast.body[1] as RelationshipNode
    expect(rel2.kind).toBe('>*|')
    expect(rel2.isNavigable).toBe(false)
  })

  it('should parse aggregation operators with default and explicit navigability', () => {
    const input = `
      Entity1 >+ Entity2
      Entity3 >+| Entity4
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(2)

    const rel1 = ast.body[0] as RelationshipNode
    expect(rel1.kind).toBe('>+')
    expect(rel1.isNavigable).toBe(true)

    const rel2 = ast.body[1] as RelationshipNode
    expect(rel2.kind).toBe('>+|')
    expect(rel2.isNavigable).toBe(false)
  })

  it('should parse navigability in relationship headers', () => {
    const input = `
      class User >*| Profile {}
      class Group >+ Roles >*| Permissions {}
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const userClass = ast.body[0] as EntityNode
    expect(userClass.relationships[0].kind).toBe('>*|')
    expect(userClass.relationships[0].isNavigable).toBe(false)

    const groupClass = ast.body[1] as EntityNode
    expect(groupClass.relationships[0].kind).toBe('>+')
    expect(groupClass.relationships[0].isNavigable).toBe(true)
    expect(groupClass.relationships[1].kind).toBe('>*|')
    expect(groupClass.relationships[1].isNavigable).toBe(false)
  })

  it('should parse non-navigability in inline attributes', () => {
    const input = `
      class Engine {
        - parts: >*| Part[*]
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const cls = ast.body[0] as EntityNode
    const attr = cls.body![0] as AttributeNode
    expect(attr.relationshipKind).toBe('>*|')
    expect(attr.isNavigable).toBe(false)
  })

  it('should parse non-navigability in method return types', () => {
    const input = `
      class Factory {
        + create(): >+| Product
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const cls = ast.body[0] as EntityNode
    const method = cls.body![0] as MethodNode
    expect(method.returnRelationshipKind).toBe('>+|')
    expect(method.isNavigable).toBe(false)
  })

  it('should parse non-navigability in parameters', () => {
    const input = `
      class Handler {
        + process(data: >*| Data): void
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const cls = ast.body[0] as EntityNode
    const method = cls.body![0] as MethodNode
    const param = method.parameters[0]
    expect(param.relationshipKind).toBe('>*|')
    expect(param.isNavigable).toBe(false)
  })

  it('should handle chained standalone relationships with mixed navigability', () => {
    const input = 'A >* B >+| C >+ D'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(3)

    const rel1 = ast.body[0] as RelationshipNode
    expect(rel1.from).toBe('A')
    expect(rel1.to).toBe('B')
    expect(rel1.isNavigable).toBe(true)

    const rel2 = ast.body[1] as RelationshipNode
    expect(rel2.from).toBe('B')
    expect(rel2.to).toBe('C')
    expect(rel2.isNavigable).toBe(false)

    const rel3 = ast.body[2] as RelationshipNode
    expect(rel3.from).toBe('C')
    expect(rel3.to).toBe('D')
    expect(rel3.isNavigable).toBe(true)
  })
})
