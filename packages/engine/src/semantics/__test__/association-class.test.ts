import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import type { Diagnostic } from '@engine/syntax/diagnostic.types'
import type { IREntity, IRRelationship } from '@engine/generator/ir/models'

describe('Association Class Support', () => {
  const analyze = (input: string) => {
    const lexer = LexerFactory.create(input)
    const tokens = lexer.tokenize()
    const parser = ParserFactory.create()
    const program = parser.parse(tokens)
    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    return analyzer.analyze(program, reporter)
  }

  it('should parse and resolve a basic association class', () => {
    const input = `
      class Estudiante
      class Curso
      class Matricula <> (Estudiante [1], Curso [*]) {
        nota: Real
      }
    `
    const ir = analyze(input)

    // 3 entities: Estudiante, Curso, Matricula (nota: Real is a UML primitive)
    expect(ir.entities).toHaveLength(3)
    const matricula = ir.entities.find((e: IREntity) => e.name === 'Matricula')
    expect(matricula).toBeDefined()
    expect(matricula?.properties).toHaveLength(1)
    expect(matricula?.properties[0].name).toBe('nota')

    // Verificar la relación bidireccional vinculada a Matricula
    expect(ir.relationships).toHaveLength(1)
    const rel = ir.relationships[0]
    expect(rel.from).toContain('Estudiante')
    expect(rel.to).toContain('Curso')
    expect(rel.fromMultiplicity).toEqual({ lower: 1, upper: 1 })
    expect(rel.toMultiplicity).toEqual({ lower: 0, upper: '*' })
    expect(rel.associationClassId).toBe(matricula?.id)
  })

  it('should support implicit entities in association class definition', () => {
    const input = `
      class Empleo <> (Empresa [0..1], Persona [*]) {
        sueldo: Real
      }
    `
    const ir = analyze(input)

    expect(ir.entities).toHaveLength(3) // Empresa, Persona (implicitas) + Empleo
    const empresa = ir.entities.find((e: IREntity) => e.name === 'Empresa')
    const persona = ir.entities.find((e: IREntity) => e.name === 'Persona')
    const empleo = ir.entities.find((e: IREntity) => e.name === 'Empleo')

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

    const relAE = ir.relationships.find(
      (r: IRRelationship) => r.from.includes('A') && r.to.includes('E'),
    )
    const relBF = ir.relationships.find(
      (r: IRRelationship) => r.from.includes('B') && r.to.includes('F'),
    )
    const relC = ir.relationships.find((r: IRRelationship) => r.associationClassId !== undefined)

    expect(relAE).toBeDefined()
    expect(relBF).toBeDefined()
    expect(relC).toBeDefined()
    expect(relC?.fromMultiplicity).toEqual({ lower: 0, upper: '*' })
    expect(relC?.toMultiplicity).toEqual({ lower: 0, upper: 2 })
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

    const relAE = ir.relationships.find(
      (r: IRRelationship) => r.from.includes('A') && r.to.includes('E'),
    )
    const relC = ir.relationships.find((r: IRRelationship) => r.associationClassId !== undefined)

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
    analyzer.analyze(program, reporter)

    const diagnostics = reporter.getDiagnostics()
    expect(
      diagnostics.some((d: Diagnostic) => d.message.includes('must have exactly 2 participants')),
    ).toBe(true)
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
      (r: IRRelationship) => r.from.includes('Customer') && r.to.includes('Plan'),
    )
    expect(subRel).toBeDefined()
    expect(subRel?.fromMultiplicity).toEqual({ lower: 1, upper: 1 })
    expect(subRel?.toMultiplicity).toEqual({ lower: 0, upper: '*' })

    // Verificar relaciones heredadas
    const inherit1 = ir.relationships.find(
      (r: IRRelationship) => r.from.includes('Customer') && r.to.includes('LegalEntity'),
    )
    expect(inherit1).toBeDefined()
  })
})
