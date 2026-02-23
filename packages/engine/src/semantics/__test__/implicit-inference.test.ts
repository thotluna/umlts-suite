import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import { DiagnosticCode, DiagnosticSeverity } from '@engine/syntax/diagnostic.types'
import { ParserContext } from '@engine/parser/parser.context'
import { DiagnosticReporter } from '@engine/parser/diagnostic-reporter'
import { IREntityType } from '@engine/generator/ir/models'

describe('Implicit Entity Type Inference', () => {
  const parseAndAnalyze = (source: string) => {
    const lexer = LexerFactory.create(source)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter)

    const ir = analyzer.analyze(program, context)
    return { parser, analyzer, program, context, ir }
  }

  it('should infer INTERFACE type when a Class implements an unknown entity', () => {
    const source = `class MyClass >I MyInterface`

    const { context, ir } = parseAndAnalyze(source)

    // Should NOT have invalid realization error
    const errors = context.getDiagnostics().filter((d) => d.severity === DiagnosticSeverity.ERROR)
    expect(errors).toHaveLength(0)

    // Verify MyInterface was created as INTERFACE
    const myInterface = ir.entities.find((e) => e.name === 'MyInterface')
    expect(myInterface).toBeDefined()
    expect(myInterface?.type).toBe(IREntityType.INTERFACE)
    expect(myInterface?.isImplicit).toBe(true)
  })

  it('should infer INTERFACE type when an Interface inherits an unknown entity', () => {
    const source = `interface MyInterface >> ParentInterface`

    const { context, ir } = parseAndAnalyze(source)

    // Should NOT have invalid inheritance error
    const errors = context.getDiagnostics().filter((d) => d.severity === DiagnosticSeverity.ERROR)
    expect(errors).toHaveLength(0)

    // Verify ParentInterface was created as INTERFACE
    const parent = ir.entities.find((e) => e.name === 'ParentInterface')
    expect(parent).toBeDefined()
    expect(parent?.type).toBe(IREntityType.INTERFACE)
    expect(parent?.isImplicit).toBe(true)
  })

  it('should infer CLASS type when a Class inherits an unknown entity', () => {
    const source = `class MyClass >> ParentClass`

    const { context, ir } = parseAndAnalyze(source)

    const errors = context.getDiagnostics().filter((d) => d.severity === DiagnosticSeverity.ERROR)
    expect(errors).toHaveLength(0)

    const parent = ir.entities.find((e) => e.name === 'ParentClass')
    expect(parent).toBeDefined()
    expect(parent?.type).toBe(IREntityType.CLASS)
    expect(parent?.isImplicit).toBe(true)
  })

  it('should infer CLASS type for associations to unknown entities', () => {
    const source = `
      class User {}
      User >> Order
    `

    const { ir } = parseAndAnalyze(source)

    // Check by id or name
    const order = ir.entities.find((e) => e.name === 'Order' || e.id === 'Order')
    expect(order).toBeDefined()
    expect(order?.type).toBe(IREntityType.CLASS)
  })

  it('should NOT overwrite existing explicit type with inferred type', () => {
    // If we define B as Class explicitly, but try to implement it, validaiton should fail
    // Inference should NOT change B to Interface just because we try to implement it
    const source = `
      class B {}
      class A >I B 
    `
    // This semantic SHOULD fail because Class cannot implement Class.
    const { context, ir } = parseAndAnalyze(source)

    const error = context
      .getDiagnostics()
      .find((d) => d.code === DiagnosticCode.SEMANTIC_REALIZATION_INVALID)
    expect(error).toBeDefined()
    expect(error?.message).toContain('Invalid implementation')

    // Verify B is still a CLASS
    const b = ir.entities.find((e) => e.name === 'B')
    expect(b?.type).toBe(IREntityType.CLASS)
  })
})
