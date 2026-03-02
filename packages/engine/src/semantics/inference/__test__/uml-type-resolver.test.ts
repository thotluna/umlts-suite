import { describe, it, expect, beforeEach } from 'vitest'
import { UMLTypeResolver } from '@engine/semantics/inference/uml-type-resolver'
import { type TypeNode } from '@engine/syntax/nodes'
import { ASTFactory } from '@engine/parser/factory/ast.factory'

describe('UMLTypeResolver', () => {
  let resolver: UMLTypeResolver

  beforeEach(() => {
    resolver = new UMLTypeResolver()
  })

  it('should identify UML standard primitives correctly', () => {
    expect(resolver.isPrimitive('Boolean')).toBe(true)
    expect(resolver.isPrimitive('Integer')).toBe(true)
    expect(resolver.isPrimitive('String')).toBe(true)
    expect(resolver.isPrimitive('UnlimitedNatural')).toBe(true)
    expect(resolver.isPrimitive('Real')).toBe(true)
  })

  it('should not identify non-UML types as primitive', () => {
    expect(resolver.isPrimitive('int')).toBe(false)
    expect(resolver.isPrimitive('number')).toBe(false)
    expect(resolver.isPrimitive('void')).toBe(false)
    expect(resolver.isPrimitive('MyClass')).toBe(false)
  })

  it('resolve() should always return null (it handles core primitives only)', () => {
    const node: TypeNode = ASTFactory.createType('Integer', 'simple', 'Integer', 0, 0)
    expect(resolver.resolve(node)).toBeNull()
  })
})
