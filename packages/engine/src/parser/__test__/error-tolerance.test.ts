import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import {
  ASTNodeType,
  type PackageNode,
  type EntityNode,
  type AttributeNode,
} from '@engine/syntax/nodes'

describe('Parser Error Tolerance (Soft Consume)', () => {
  it('should parse a package even if the name is missing', () => {
    const input = `
      package {
        class Inside {}
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(1)
    const pkg = ast.body[0] as PackageNode
    expect(pkg.type).toBe(ASTNodeType.PACKAGE)
    expect(pkg.name).toBe('<missing:IDENTIFIER>')
    expect(pkg.body).toHaveLength(1)
    expect(pkg.body[0].type).toBe(ASTNodeType.CLASS)

    expect(ast.diagnostics).toBeDefined()
    expect(ast.diagnostics!.some((d) => d.message.includes('Package name expected'))).toBe(true)
  })

  it('should parse a package even if the closing brace is missing', () => {
    const input = `
      package myPkg {
        class Inside {}
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(1)
    const pkg = ast.body[0] as PackageNode
    expect(pkg.name).toBe('myPkg')
    expect(pkg.body).toHaveLength(1)

    expect(ast.diagnostics).toBeDefined()
    expect(
      ast.diagnostics!.some((d) => d.message.includes("Expected '}' for package closing")),
    ).toBe(true)
  })

  it('should parse a class even if the name is missing', () => {
    const input = `class { }`
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(1)
    expect(ast.body[0].type).toBe(ASTNodeType.CLASS)
    expect((ast.body[0] as EntityNode).name).toBe('<missing:IDENTIFIER>')
  })

  it('should recover from malformed member inside a class', () => {
    const input = `
      class User {
        name: string
        !!! 
        age: number
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    expect(ast.body).toHaveLength(1)
    const cls = ast.body[0] as EntityNode
    // Debería tener name y age
    const members = cls.body || []
    const attributes = members.filter((m): m is AttributeNode => m.type === ASTNodeType.ATTRIBUTE)
    expect(attributes).toHaveLength(2)
    expect(attributes[0].name).toBe('name')
    expect(attributes[1].name).toBe('age')
  })
})
