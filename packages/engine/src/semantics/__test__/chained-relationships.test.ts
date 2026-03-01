import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'

describe('Chained Relationships Support', () => {
  const analyze = (input: string) => {
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()

    return analyzer.analyze(program, reporter)
  }

  it('should support chained relationships: A >> B >> C >> D', () => {
    const input = 'A >> B >> C >> D'
    const ir = analyze(input)

    expect(ir.entities).toHaveLength(4)
    expect(ir.relationships).toHaveLength(3)

    expect(ir.relationships[0].from).toContain('A')
    expect(ir.relationships[0].to).toContain('B')

    expect(ir.relationships[1].from).toContain('B')
    expect(ir.relationships[1].to).toContain('C')

    expect(ir.relationships[2].from).toContain('C')
    expect(ir.relationships[2].to).toContain('D')
  })

  it('should support complex chains with multiplicities: A [1] >> B [2] >> C [4]', () => {
    const input = 'A [1] >> B [2] >> C [4]'
    const ir = analyze(input)

    expect(ir.relationships).toHaveLength(2)

    expect(ir.relationships[0].fromMultiplicity).toEqual({ lower: 1, upper: 1 })
    expect(ir.relationships[0].toMultiplicity).toEqual({ lower: 2, upper: 2 })

    // When chaining, B is the source of the next relationship,
    // but the array length doesn't allow setting different fromMultiplicity for B
    // if B is in the middle of a chain without an explicit block.
    // In our parser logic, `fromMultiplicity` resets or takes the one defined before B if none.
    // Given 'A [1] >> B [2] >> C [4]', B's multiplicity as target is [2],
    // and as source it will be undefined (thus defaulting to '0..*')
    // UNLESS we use string literal fallback or specific parsing.
    // Let's test the new valid syntax:
    expect(ir.relationships[1].fromMultiplicity).toBeUndefined()
    expect(ir.relationships[1].toMultiplicity).toEqual({ lower: 4, upper: 4 })
  })
})
