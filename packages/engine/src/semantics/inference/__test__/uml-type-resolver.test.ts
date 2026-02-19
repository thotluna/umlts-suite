import { describe, it, expect, beforeEach } from 'vitest'
import { UMLTypeResolver } from '../uml-type-resolver'
import { ASTNodeType, type TypeNode } from '../../../syntax/nodes'

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
    const node: TypeNode = {
      type: ASTNodeType.TYPE,
      kind: 'simple',
      name: 'Integer',
      raw: 'Integer',
      arguments: [], // TypeNode has arguments
      line: 0,
      column: 0,
    }
    expect(resolver.resolve(node)).toBeNull()
  })
})
