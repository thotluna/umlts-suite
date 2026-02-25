import { describe, it, expect } from 'vitest'
import { UMLEngine, ASTNodeType } from '@umlts/engine'
import type { PackageNode, EntityNode } from '@umlts/engine'
import { TypeScriptPlugin } from '@plugin-ts/index'

describe('TypeScript Syntax Extension', () => {
  it('should parse namespace block as a package', () => {
    const engine = new UMLEngine([new TypeScriptPlugin()])
    const source = `
      namespace TestNamespace {
        class A {}
      }
    `
    const { ast, diagnostics } = engine.parse(source)

    expect(diagnostics).toHaveLength(0)
    expect(ast.body).toHaveLength(1)

    const nsNode = ast.body[0] as PackageNode
    expect(nsNode.type).toBe(ASTNodeType.PACKAGE)
    expect(nsNode.name).toBe('TestNamespace')
  })

  it('should parse type alias as an interface with <<type>> stereotype', () => {
    const engine = new UMLEngine([new TypeScriptPlugin()])
    const source = `
      type MyType = {
        name: string
      }
    `
    const { ast, diagnostics } = engine.parse(source)

    expect(diagnostics).toHaveLength(0)
    expect(ast?.body).toHaveLength(1)

    const typeNode = ast!.body[0] as EntityNode
    expect(typeNode.type).toBe(ASTNodeType.INTERFACE)
    expect(typeNode.name).toBe('MyType')
    expect(typeNode.docs).toContain('<<type>>')
    expect(typeNode.body).toHaveLength(1)
  })

  it('should parse generic type aliases', () => {
    const engine = new UMLEngine([new TypeScriptPlugin()])
    const source = `
      type Optional<T> = {
        value: T
      }
    `
    const { ast, diagnostics } = engine.parse(source)

    expect(diagnostics).toHaveLength(0)
    expect(ast?.body).toHaveLength(1)

    const typeNode = ast!.body[0] as EntityNode
    expect(typeNode.type).toBe(ASTNodeType.INTERFACE)
    expect(typeNode.name).toBe('Optional')
    expect(typeNode.typeParameters).toEqual(['T'])
  })
})
