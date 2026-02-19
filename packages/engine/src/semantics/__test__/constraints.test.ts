import { describe, it, expect } from 'vitest'
import { LexerFactory } from '../../lexer/lexer.factory'
import { ParserFactory } from '../../parser/parser.factory'
import { SemanticAnalyzer } from '../analyzer'
import { ParserContext } from '../../parser/parser.context'
import { DiagnosticReporter } from '../../parser/diagnostic-reporter'

describe('Constraint Semantics', () => {
  it('should process standalone XOR blocks', () => {
    const input = `
      class A {}
      class B {}
      class C {}
      xor { 
        A >< B
        A >< C 
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter)
    const ir = analyzer.analyze(ast, context)

    // Should have 1 global XOR constraint
    expect(ir.constraints).toHaveLength(1)
    expect(ir.constraints[0].kind).toBe('xor')

    // Relationships should have internal XOR markers
    const groupName = ir.constraints[0].targets[0]
    expect(ir.relationships).toHaveLength(2)
    ir.relationships.forEach((rel) => {
      expect(rel.constraints).toBeDefined()
      expect(rel.constraints![0].kind).toBe('xor_member')
      expect(rel.constraints![0].targets).toContain(groupName)
    })
  })

  it('should process inline XOR constraints on members', () => {
    const input = `
      class Engine {
        + variantA: Part {xor: g1}
        + variantB: Part {xor: g1}
      }
      class Part {}
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter)
    const ir = analyzer.analyze(ast, context)

    // Check entities
    const engine = ir.entities.find((e) => e.name === 'Engine')
    expect(engine!.properties[0].constraints).toHaveLength(1)
    expect(engine!.properties[0].constraints![0].kind).toBe('xor')
    expect(engine!.properties[0].constraints![0].targets).toContain('g1')

    // Check inferred relationships
    expect(ir.relationships).toHaveLength(2)
    ir.relationships.forEach((rel) => {
      expect(rel.constraints).toHaveLength(1)
      expect(rel.constraints![0].kind).toBe('xor_member')
      expect(rel.constraints![0].targets).toContain('g1')
    })

    // Check global constraint registration
    expect(ir.constraints).toHaveLength(1)
    expect(ir.constraints[0].kind).toBe('xor')
    expect(ir.constraints[0].targets).toContain('g1')
  })
})
