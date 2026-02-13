import { describe, it, expect } from 'vitest'
import { LexerFactory } from '../../lexer/lexer.factory'
import { ParserFactory } from '../../parser/parser.factory'
import { SemanticAnalyzer } from '../analyzer'
import { DiagnosticCode, DiagnosticSeverity, type Diagnostic } from '../../parser/diagnostic.types'
import { ParserContext } from '../../parser/parser.context'

describe('Semantic Rules', () => {
  const parseAndAnalyze = (source: string) => {
    const lexer = LexerFactory.create(source)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()

    // Creamos un contexto limpio para el análisis semántico
    const context = new ParserContext(tokens)

    return { parser, analyzer, program, context }
  }

  it('should detect inheritance mismatch (Interface extending Class)', () => {
    const source = `
      class Animal {}
      interface Runnable >> Animal {} // Error: Interface extending Class
    `
    const { analyzer, program, context } = parseAndAnalyze(source)
    analyzer.analyze(program, context)

    const diagnostics = context.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Herencia inválida')
  })

  it('should detect realization mismatch (Class implementing Class)', () => {
    const source = `
      class A {}
      class B >I A {} // Error: Class implementing Class
    `
    const { analyzer, program, context } = parseAndAnalyze(source)
    analyzer.analyze(program, context)

    const diagnostics = context.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_REALIZATION_INVALID,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Realización inválida')
  })

  it('should detect direct cycles in inheritance', () => {
    const source = `
      class A >> A {} // Direct cycle
    `
    const { analyzer, program, context } = parseAndAnalyze(source)
    analyzer.analyze(program, context)

    const diagnostics = context.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_CYCLE_DETECTED,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Ciclo de herencia detectado: A -> A')
  })

  it('should detect indirect cycles in inheritance', () => {
    const source = `
      class A >> B {}
      class B >> C {}
      class C >> A {} // Indirect cycle
    `
    const { analyzer, program, context } = parseAndAnalyze(source)
    analyzer.analyze(program, context)

    const diagnostics = context.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_CYCLE_DETECTED,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Ciclo')
  })

  it('should allow valid inheritance', () => {
    const source = `
      class Animal {}
      class Dog >> Animal {}
    `
    const { analyzer, program, context } = parseAndAnalyze(source)
    // No errors expected
    analyzer.analyze(program, context)
    const errors = context
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
    const { analyzer, program, context } = parseAndAnalyze(source)
    analyzer.analyze(program, context)

    const diagnostics = context.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_DUPLICATE_MEMBER,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Miembro duplicado')
  })

  it('should detect inheritance mismatch in top-level relationships', () => {
    const source = `
      class A {}
      interface I {}
      A >> I // Error: Class extending Interface
    `
    const { analyzer, program, context } = parseAndAnalyze(source)
    analyzer.analyze(program, context)

    const diagnostics = context.getDiagnostics()
    const error = diagnostics.find(
      (d: Diagnostic) => d.code === DiagnosticCode.SEMANTIC_INHERITANCE_MISMATCH,
    )
    expect(error).toBeDefined()
    expect(error?.message).toContain('Herencia inválida')
  })
})
