import { describe, it, expect } from 'vitest'
import { LexerFactory } from '../../lexer/lexer.factory'
import { ParserFactory } from '../parser.factory'
import {
  ASTNodeType,
  type EntityNode,
  type PackageNode,
  type AttributeNode,
  type MethodNode,
  type RelationshipNode,
} from '../ast/nodes'

describe('Parser', () => {
  it('should parse a simple class', () => {
    const input = 'class User {}'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.type).toBe(ASTNodeType.PROGRAM)
    expect(ast.body).toHaveLength(1)
    expect(ast.body[0].type).toBe(ASTNodeType.CLASS)
    expect((ast.body[0] as EntityNode).name).toBe('User')
  })

  it('should parse a package with a class inside', () => {
    const input = 'package core { class Domain {} }'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body[0].type).toBe(ASTNodeType.PACKAGE)
    const pkg = ast.body[0] as PackageNode
    expect(pkg.name).toBe('core')
    expect(pkg.body).toHaveLength(1)
    expect(pkg.body[0].type).toBe(ASTNodeType.CLASS)
  })

  it('should parse a class with attributes and methods', () => {
    const input = `
      class User {
        + name: string
        - age: number [0..1]
        public static login(id: string): boolean
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const cls = ast.body[0] as EntityNode
    expect(cls.body).toHaveLength(3)

    const attr1 = cls.body![0] as AttributeNode
    expect(attr1.type).toBe(ASTNodeType.ATTRIBUTE)
    expect(attr1.name).toBe('name')
    expect(attr1.visibility).toBe('+')
    expect(attr1.typeAnnotation.name).toBe('string')

    const attr2 = cls.body![1] as AttributeNode
    expect(attr2.multiplicity).toBe('[0..1]')

    const method = cls.body![2] as MethodNode
    expect(method.type).toBe(ASTNodeType.METHOD)
    expect(method.isStatic).toBe(true)
    expect(method.parameters).toHaveLength(1)
    expect(method.returnType.name).toBe('boolean')
  })

  it('should parse a class with relationship header', () => {
    const input = 'class Admin >> User, >I IAuth {}'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const cls = ast.body[0] as EntityNode
    expect(cls.relationships).toHaveLength(2)
    expect(cls.relationships[0].kind).toBe('>>')
    expect(cls.relationships[0].target).toBe('User')
    expect(cls.relationships[1].kind).toBe('>I')
    expect(cls.relationships[1].target).toBe('IAuth')
  })

  it('should parse a standalone relationship with multiplicities', () => {
    const input = 'User [1] >> [*] Post'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(1)
    const rel = ast.body[0] as RelationshipNode
    expect(rel.type).toBe(ASTNodeType.RELATIONSHIP)
    expect(rel.from).toBe('User')
    expect(rel.fromMultiplicity).toBe('[1]')
    expect(rel.kind).toBe('>>')
    expect(rel.toMultiplicity).toBe('[*]')
    expect(rel.to).toBe('Post')
  })

  it('should parse parameter multiplicity', () => {
    const input = 'class Repo { + save(items: Item[1..*]): void }'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const cls = ast.body[0] as EntityNode
    const method = cls.body![0] as MethodNode
    const param = method.parameters[0]
    expect(param.name).toBe('items')
    expect(param.multiplicity).toBe('[1..*]')
  })

  it('should parse new dependency operators (>- and >use)', () => {
    const input = 'Service >- API Component >use Library'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(2)
    expect((ast.body[0] as RelationshipNode).kind).toBe('>-')
    expect((ast.body[1] as RelationshipNode).kind).toBe('>use')
  })
})
