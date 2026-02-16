import { describe, it, expect } from 'vitest'
import { LexerFactory } from '../../lexer/lexer.factory'
import { ParserFactory } from '../../parser/parser.factory'
import { ParserContext } from '../../parser/parser.context'
import { DiagnosticReporter } from '../../parser/diagnostic-reporter'
import { SemanticAnalyzer } from '../analyzer'

describe('Association Class Support', () => {
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

  it('should parse and resolve a basic association class', () => {
    const input = `
      class Estudiante
      class Curso
      class Matricula <> (Estudiante [1], Curso [*]) {
        nota: number
      }
    `
    const ir = analyze(input)

    // Verificar que existen las 3 entidades
    expect(ir.entities).toHaveLength(3)
    const matricula = ir.entities.find((e) => e.name === 'Matricula')
    expect(matricula).toBeDefined()
    expect(matricula?.members).toHaveLength(1)
    expect(matricula?.members[0].name).toBe('nota')

    // Verificar la relación bidireccional vinculada a Matricula
    expect(ir.relationships).toHaveLength(1)
    const rel = ir.relationships[0]
    expect(rel.from).toContain('Estudiante')
    expect(rel.to).toContain('Curso')
    expect(rel.fromMultiplicity).toBe('1')
    expect(rel.toMultiplicity).toBe('*')
    expect(rel.associationClassId).toBe(matricula?.id)
  })

  it('should support implicit entities in association class definition', () => {
    const input = `
      class Empleo <> (Empresa [0..1], Persona [*]) {
        sueldo: number
      }
    `
    const ir = analyze(input)

    expect(ir.entities).toHaveLength(3) // Empresa, Persona (implicitas) + Empleo
    const empresa = ir.entities.find((e) => e.name === 'Empresa')
    const persona = ir.entities.find((e) => e.name === 'Persona')
    const empleo = ir.entities.find((e) => e.name === 'Empleo')

    expect(empresa?.isImplicit).toBe(true)
    expect(persona?.isImplicit).toBe(true)
    expect(empleo?.isImplicit).toBe(false)

    expect(ir.relationships[0].associationClassId).toBe(empleo?.id)
  })

  it('should support recursive relationships (Grado Dios!)', () => {
    const input = `
      class C <> (A [*] >> E, B [0..2] >> F)
    `
    const ir = analyze(input)

    // Entidades: C, A, E, B, F
    expect(ir.entities).toHaveLength(5)

    // Relaciones: A>>E, B>>F y la asociación C vinculando A y B
    expect(ir.relationships).toHaveLength(3)

    const relAE = ir.relationships.find((r) => r.from.includes('A') && r.to.includes('E'))
    const relBF = ir.relationships.find((r) => r.from.includes('B') && r.to.includes('F'))
    const relC = ir.relationships.find((r) => r.associationClassId !== undefined)

    expect(relAE).toBeDefined()
    expect(relBF).toBeDefined()
    expect(relC).toBeDefined()
    expect(relC?.fromMultiplicity).toBe('*')
    expect(relC?.toMultiplicity).toBe('0..2')
  })

  it('should respect comma boundaries in participants: (A >> E, B)', () => {
    const input = `
      class C <> (A >> E, B)
    `
    const ir = analyze(input)

    // Entidades: C, A, E, B
    expect(ir.entities).toHaveLength(4)

    // Relación A>>E y la asociación C vinculando A y B
    expect(ir.relationships).toHaveLength(2)

    const relAE = ir.relationships.find((r) => r.from.includes('A') && r.to.includes('E'))
    const relC = ir.relationships.find((r) => r.associationClassId !== undefined)

    expect(relAE).toBeDefined()
    expect(relC).toBeDefined()
    expect(relC?.from).toContain('A')
    expect(relC?.to).toContain('B')
  })

  it('should report error for more than 2 participants', () => {
    const input = `
      class C <> (A, B, D)
    `
    // No usamos la función analyze que oculta los diagnósticos
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const context = new ParserContext(tokens, reporter)
    analyzer.analyze(program, context)

    const diagnostics = context.getDiagnostics()
    expect(diagnostics.some((d) => d.message.includes('must have exactly 2 participants'))).toBe(
      true,
    )
  })

  it('should parse association class with multiplicity before relationship', () => {
    const input = `
      class Subscription <> (
        Customer [1] >> LegalEntity, 
        Plan [*] >> BaseProduct
      )
    `
    const ir = analyze(input)

    // Debería tener Customer, Plan, Subscription, LegalEntity, BaseProduct
    expect(ir.entities).toHaveLength(5)

    // Verificar relación de Subscription
    const subRel = ir.relationships.find(
      (r) => r.from.includes('Customer') && r.to.includes('Plan'),
    )
    expect(subRel).toBeDefined()
    expect(subRel?.fromMultiplicity).toBe('1')
    expect(subRel?.toMultiplicity).toBe('*')

    // Verificar relaciones heredadas
    const inherit1 = ir.relationships.find(
      (r) => r.from.includes('Customer') && r.to.includes('LegalEntity'),
    )
    expect(inherit1).toBeDefined()
  })
})
