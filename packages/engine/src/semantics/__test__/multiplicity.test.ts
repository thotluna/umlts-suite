import { describe, it, expect } from 'vitest'
import { UMLEngine } from '../../index'
import { DiagnosticCode } from '../../parser/diagnostic.types'

describe('Multiplicity and Composite Rules', () => {
  const engine = new UMLEngine()

  it('should report error when upper multiplicity is less than lower multiplicity in attributes', () => {
    const code = `
      class User {
        ids: string[5..2]
      }
    `
    const { diagnostics } = engine.parse(code)

    const errors = diagnostics.filter(
      (d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
    )
    expect(errors.length).toBe(1)
    expect(errors[0].message).toContain('Inconsistent multiplicity')
  })

  it('should report error when upper multiplicity is less than lower multiplicity in relationships', () => {
    const code = `
      class A {}
      class B {}
      A "5..2" > "1" B
    `
    const { diagnostics } = engine.parse(code)

    const errors = diagnostics.filter(
      (d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
    )
    expect(errors.length).toBe(1)
    expect(errors[0].message).toContain('Inconsistent multiplicity')
  })

  it('should report error in composite aggregation when whole end multiplicity is > 1', () => {
    const code = `
      class Whole {}
      class Part {}
      Whole "2" >* "1" Part
    `
    const { diagnostics } = engine.parse(code)

    const errors = diagnostics.filter((d) => d.code === DiagnosticCode.SEMANTIC_COMPOSITE_VIOLATION)
    expect(errors.length).toBe(1)
    expect(errors[0].message).toContain('Composition Violation')
  })

  it('should NOT report error in composite aggregation when whole end multiplicity is 1', () => {
    const code = `
      class Whole {}
      class Part {}
      Whole "1" >* "1" Part
    `
    const { diagnostics } = engine.parse(code)

    const errors = diagnostics.filter((d) => d.code === DiagnosticCode.SEMANTIC_COMPOSITE_VIOLATION)
    expect(errors.length).toBe(0)
  })

  it('should correctly handle "*" as infinity in multiplicity', () => {
    const code = `
      class A {
        names: string[1..*]
      }
    `
    const { diagnostics } = engine.parse(code)

    const errors = diagnostics.filter(
      (d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
    )
    expect(errors.length).toBe(0)
  })

  it('should report error for invalid multiplicity format', () => {
    const code = `
      class A {
        invalid: string[abc]
      }
    `
    const { diagnostics } = engine.parse(code)

    const errors = diagnostics.filter(
      (d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
    )
    expect(errors.length).toBe(1)
    expect(errors[0].message).toContain('Invalid multiplicity format')
  })

  it('should handle single value multiplicities correctly', () => {
    const code = `
      class A {
        exactlyOne: string[1]
        many: string[*]
      }
    `
    const { diagnostics } = engine.parse(code)
    const errors = diagnostics.filter(
      (d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
    )
    expect(errors.length).toBe(0)
  })

  it('should support multiplicities with quotes in relationships', () => {
    const code = `
      A "0..1" > B
    `
    const { diagnostics } = engine.parse(code)
    expect(
      diagnostics.filter((d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY).length,
    ).toBe(0)
  })

  it('should report error for invalid range format (too many dots)', () => {
    const code = `
      class A {
        bad: string[1..2..3]
      }
    `
    const { diagnostics } = engine.parse(code)
    const errors = diagnostics.filter(
      (d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY,
    )
    expect(errors.length).toBe(1)
  })
  it('should handle [ * ] and [ 0..* ] as equivalent', () => {
    const code = `
      class A {
        m1: string[*]
        m2: string[0..*]
      }
    `
    const { diagnostics } = engine.parse(code)
    expect(
      diagnostics.filter((d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY).length,
    ).toBe(0)
  })

  it('should handle spaces in multiplicity range [ 1 .. 2 ]', () => {
    const code = `
      class A {
        m: string[ 1 .. 2 ]
      }
    `
    const { diagnostics } = engine.parse(code)
    expect(
      diagnostics.filter((d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY).length,
    ).toBe(0)
  })

  it('should handle multiplicities with single number without brackets', () => {
    const code = `
      A "1" > B
    `
    const { diagnostics } = engine.parse(code)
    expect(
      diagnostics.filter((d) => d.code === DiagnosticCode.SEMANTIC_INVALID_MULTIPLICITY).length,
    ).toBe(0)
  })
})
