import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import {
  DiagnosticCode,
  DiagnosticSeverity,
  type Diagnostic,
} from '@engine/syntax/diagnostic.types'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'

describe('Semantic Rules', () => {
  const parseAndAnalyze = (source: string) => {
    const lexer = LexerFactory.create(source)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()

    // Creamos un contexto limpio para el análisis semántico
    const reporter = new DiagnosticReporter()

    return { parser, analyzer, program, reporter }
  }

  it('should detect inheritance mismatch (Interface extending Class)', () => {
    const source = `
      class Animal {}
      interface Runnable >> Animal {} // Error: Interface extending Class
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_GENERALIZATION_MISMATCH,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Invalid inheritance')
  })

  it('should detect realization mismatch (Class implementing Class)', () => {
    const source = `
      class A {}
      class B >I A {} // Error: Class implementing Class
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_INTERFACE_REALIZATION_INVALID,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Invalid implementation')
  })

  it('should detect direct cycles in inheritance', () => {
    const source = `
      class A >> A {} // Direct cycle
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_CYCLE_DETECTED,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Inheritance cycle detected: A -> A')
  })

  it('should detect indirect cycles in inheritance', () => {
    const source = `
      class A >> B {}
      class B >> C {}
      class C >> A {} // Indirect cycle
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_CYCLE_DETECTED,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('cycle')
  })

  it('should allow valid inheritance', () => {
    const source = `
      class Animal {}
      class Dog >> Animal {}
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    // No errors expected
    analyzer.analyze(program, reporter)
    const errors = reporter
      .getDiagnostics()
      .filter((d: Diagnostic) => d.severity === DiagnosticSeverity.ERROR)
    expect(errors).toHaveLength(0)
  })

  it('should detect duplicate members', () => {
    const source = `
      class User {
        name: string
        name: string // Error: Duplicate member
      }
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Duplicate member')
  })

  it('should detect duplicate entity definitions', () => {
    const source = `
      class User {}
      class User {} // Error: Duplicate entity
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find((d: Diagnostic) => d.message.includes('is already defined'))
    expect(error).toBeDefined()
  })

  it('should report multiple semantic errors at once', () => {
    const source = `
      class A >> A {}
      class B {
        x: string
        x: number
      }
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    expect(diagnostics.length).toBeGreaterThanOrEqual(2)
    expect(
      diagnostics.some((d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_CYCLE_DETECTED),
    ).toBe(true)
    expect(
      diagnostics.some((d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER),
    ).toBe(true)
  })

  it('should resolve forward references in packages (Pass 1 Discovery)', () => {
    const source = `
      package P1 {
        class A {
          - b: >- B
        }
        
        package Sub {
          class B {}
        }
      }
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)
    const diagnostics = reporter.getDiagnostics()

    // No debería haber errores de "Entidad implícita" porque B se registra en la pasada 1
    const implicitErrors = diagnostics.filter(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_IMPLICIT_ENTITY,
    )
    expect(implicitErrors.length).toBe(0)
  })

  it('should detect and report ambiguous entity resolution', () => {
    const source = `
      package P1 { class Target {} }
      package P2 { class Target {} }
      
      class Source {
          - t: Target
      }
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_AMBIGUOUS_ENTITY,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Ambiguity detected')
  })

  it('should detect invalid aggregation on Enums', () => {
    const source = `
      enum Color { RED, BLUE }
      class Car
      Color >+ Car // Error: Enum cannot be the whole of an aggregation
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => /enum/i.test(d.message) && /aggregation/i.test(d.message),
    )
    expect(error).toBeDefined()
  })

  it('should allow valid composition on Interfaces', () => {
    const source = `
      interface IView
      class Element
      IView >* Element
    `
    const { analyzer, program, reporter } = parseAndAnalyze(source)
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => /interface/i.test(d.message) && /composition/i.test(d.message),
    )
    expect(error).toBeUndefined()
  })
})
