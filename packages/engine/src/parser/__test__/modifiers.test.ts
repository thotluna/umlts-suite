import { describe, it, expect } from 'vitest'
import { UMLEngine } from '@engine/index'
import { DiagnosticCode } from '@engine/syntax/diagnostic.types'

describe('Leaf and Final Modifiers', () => {
  const engine = new UMLEngine()

  it('should parse leaf classes', () => {
    const code = `
      leaf class MyLeafClass {
        + attr: string
      }
      !class MyOtherLeafClass {}
    `
    const { diagram } = engine.parse(code)

    const cls1 = diagram.entities.find((e) => e.name === 'MyLeafClass')
    const cls2 = diagram.entities.find((e) => e.name === 'MyOtherLeafClass')

    expect(cls1?.isLeaf).toBe(true)
    expect(cls2?.isLeaf).toBe(true)
  })

  it('should parse final classes', () => {
    const code = `
      final class MyFinalClass {}
    `
    const { diagram } = engine.parse(code)

    const cls = diagram.entities.find((e) => e.name === 'MyFinalClass')
    expect(cls).toBeDefined()
  })

  it('should parse leaf and final methods', () => {
    const code = `
      class Base {
        leaf method1(): void
        final method2(): void
        !method3(): void
      }
    `
    const { diagram } = engine.parse(code)
    const cls = diagram.entities.find((e) => e.name === 'Base')

    const m1 = cls?.operations.find((m) => m.name === 'method1')
    const m2 = cls?.operations.find((m) => m.name === 'method2')
    const m3 = cls?.operations.find((m) => m.name === 'method3')

    expect(m1?.isLeaf).toBe(true)
    expect(m2?.isLeaf).toBe(true)
    expect(m3?.isLeaf).toBe(true)
  })

  it('should report error when inheriting from leaf entity', () => {
    const code = `
      leaf class Base {}
      class Derived >> Base {}
    `
    const { diagnostics } = engine.parse(code)

    expect(
      diagnostics.some((d) => d.code === DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH),
    ).toBe(true)
    expect(diagnostics[0].message).toContain("cannot extend 'Base' because it is marked as {leaf}")
  })

  it('should report error when inheriting from final entity', () => {
    const code = `
      final class Base {}
      class Derived >> Base {}
    `
    const { diagnostics } = engine.parse(code)

    expect(
      diagnostics.some((d) => d.code === DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH),
    ).toBe(true)
    expect(diagnostics[0].message).toContain(
      "cannot extend 'Base' because it is marked as <<final>>",
    )
  })

  it('should report error when entity is both abstract and leaf', () => {
    const code = `
      abstract leaf class Broken {}
    `
    const { diagnostics } = engine.parse(code)

    expect(
      diagnostics.some((d) => d.code === DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH),
    ).toBe(true)
    expect(diagnostics[0].message).toContain("cannot be both 'abstract' and 'leaf'")
  })

  it('should parse root classes', () => {
    const code = `
      root class MyRootClass {}
      ^class MyOtherRootClass {}
    `
    const { diagram } = engine.parse(code)

    const cls1 = diagram.entities.find((e) => e.name === 'MyRootClass')
    const cls2 = diagram.entities.find((e) => e.name === 'MyOtherRootClass')

    expect(cls1).toBeDefined()
    expect(cls2).toBeDefined()
  })

  it('should report error when root class tries to extend', () => {
    const code = `
      class Base {}
      root class Broken >> Base {}
    `
    const { diagnostics } = engine.parse(code)

    expect(
      diagnostics.some((d) => d.code === DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH),
    ).toBe(true)
    expect(diagnostics[0].message).toContain("is marked as {root} and cannot extend 'Base'")
  })

  it('should apply modifiers to implicit entities in relationships', () => {
    const code = 'class A >> ^*B'
    const { diagram } = engine.parse(code)

    const entityB = diagram.entities.find((e) => e.name === 'B')
    expect(entityB).toBeDefined()
    expect(entityB?.isAbstract).toBe(true)
  })

  it('should parse complex relationship with multiple modifiers', () => {
    const code = 'class A >> !^C'
    const { diagram } = engine.parse(code)

    const entityC = diagram.entities.find((e) => e.name === 'C')
    expect(entityC).toBeDefined()
    expect(entityC?.isLeaf).toBe(true)
  })

  it('should allow modifiers in any order', () => {
    const code = `
      *^$ class Order1 {}
      $^ class Order2 {}
      ^!$ class Order3 {}
    `
    const { diagram } = engine.parse(code)

    const cls1 = diagram.entities.find((e) => e.name === 'Order1')
    const cls2 = diagram.entities.find((e) => e.name === 'Order2')
    const cls3 = diagram.entities.find((e) => e.name === 'Order3')

    expect(cls1?.isAbstract).toBe(true)
    expect(cls1?.isStatic).toBe(true)

    expect(cls2?.isStatic).toBe(true)

    expect(cls3?.isLeaf).toBe(true)
    expect(cls3?.isStatic).toBe(true)
  })
})
