import { describe, it, expect } from 'vitest'
import { LexerFactory } from '../../lexer/lexer.factory'
import { ParserFactory } from '../../parser/parser.factory'
import { ParserContext } from '../../parser/parser.context'
import { DiagnosticReporter } from '../../parser/diagnostic-reporter'
import { SemanticAnalyzer } from '../analyzer'

describe('Chained Relationships Support', () => {
  const analyze = (input: string) => {
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter)
    return analyzer.analyze(program, context)
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

  it('should support complex chains with multiplicities: A [1] >> [2] B [3] >> [4] C', () => {
    const input = 'A [1] >> [2] B [3] >> [4] C'
    const ir = analyze(input)

    expect(ir.relationships).toHaveLength(2)

    expect(ir.relationships[0].fromMultiplicity).toEqual({ lower: 1, upper: 1 })
    expect(ir.relationships[0].toMultiplicity).toEqual({ lower: 2, upper: 2 })

    expect(ir.relationships[1].fromMultiplicity).toEqual({ lower: 3, upper: 3 })
    expect(ir.relationships[1].toMultiplicity).toEqual({ lower: 4, upper: 4 })
  })
})
