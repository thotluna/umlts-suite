import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'
import type { IREntity, IRRelationship } from '@engine/generator/ir/models'

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

    const ir = analyzer.analyze(ast, reporter)

    // Should have 1 global XOR constraint
    expect(ir.constraints).toHaveLength(1)
    expect(ir.constraints[0].kind).toBe('xor')

    // Relationships should have internal XOR markers
    const groupName = ir.constraints[0].targets[0]
    expect(ir.relationships).toHaveLength(2)
    ir.relationships.forEach((rel: IRRelationship) => {
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

    const ir = analyzer.analyze(ast, reporter)

    // Check entities
    const engine: IREntity | undefined = ir.entities.find((e: IREntity) => e.name === 'Engine')
    expect(engine).toBeDefined()
    expect(engine!.properties[0].constraints).toHaveLength(1)
    expect(engine!.properties[0].constraints![0].kind).toBe('xor')
    expect(engine!.properties[0].constraints![0].targets).toContain('g1')

    // Check inferred relationships
    expect(ir.relationships).toHaveLength(2)
    ir.relationships.forEach((rel: IRRelationship) => {
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
