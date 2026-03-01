import { describe, it, expect } from 'vitest'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'
import { DiagnosticSeverity } from '@engine/syntax/diagnostic.types'

describe('Profiles Semantics - Validation Rules', () => {
  function analyze(code: string) {
    const lexer = LexerFactory.create(code)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    analyzer.analyze(program, reporter)
    return reporter.getDiagnostics()
  }

  it('R1: Metadata should fail if stereotype extends a different metaclass', () => {
    const code = `
      profile Java {
        stereotype Entity >> class
      }

      @Entity
      interface IRepository {}
    `
    const diagnostics = analyze(code)
    const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.ERROR)

    expect(errors.length).toBeGreaterThan(0)
    expect(
      errors.some((e) => e.message.toLowerCase().includes('cannot be applied to interface')),
    ).toBe(true)
  })

  it('R1: Metadata should pass if stereotype extends compatible metaclass', () => {
    const code = `
      profile Java {
        stereotype Entity >> class
      }

      @Entity
      class User {}
    `
    const diagnostics = analyze(code)
    const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.ERROR)
    expect(errors.length).toBe(0)
  })

  it.todo('R3: Should fail if tagged value type mismatch (expected Integer, got String)', () => {
    const code = `
      profile DB {
        stereotype column {
          size: Integer
        }
      }

      @column
      class User {
        [ size="large" ]
        name: String
      }
    `
    const diagnostics = analyze(code)
    const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.ERROR)

    expect(errors.length).toBeGreaterThan(0)
    expect(errors.some((e) => e.message.includes('expects Integer, but got string'))).toBe(true)
  })

  it.todo('R3: Should pass if tagged value type matches', () => {
    const code = `
      profile DB {
        stereotype column {
          size: Integer
        }
      }

      @column
      class User {
        [ size=255 ]
        name: String
      }
    `
    const diagnostics = analyze(code)
    const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.ERROR)
    expect(errors.length).toBe(0)
  })

  it('Inference: Should report error if stereotype is not defined', () => {
    const code = `
      @UnknownStereotype
      class User {}
    `
    const diagnostics = analyze(code)
    const errors = diagnostics.filter((d) => d.severity === DiagnosticSeverity.ERROR)

    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].message).toContain('not defined in any loaded profile')
  })
})
