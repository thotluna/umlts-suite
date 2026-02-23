import { describe, it, expect } from 'vitest'
import { LexerFactory } from '@engine/lexer/lexer.factory'
import { ParserFactory } from '@engine/parser/parser.factory'
import { SemanticAnalyzer } from '@engine/semantics/analyzer'
import { IRRelationshipType, type IRRelationship, type IREntity } from '@engine/generator/ir/models'
import { DiagnosticReporter } from '@engine/core/diagnostics/diagnostic-reporter'

describe('SemanticAnalyzer', () => {
  it('should create an implicit entity when a relationship target is missing', () => {
    const input = 'class Hero >> Person {}'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const ir = analyzer.analyze(ast, reporter)

    // Should have 2 entities: Hero (explicit) and Person (implicit)
    expect(ir.entities).toHaveLength(2)

    const hero = ir.entities.find((e: IREntity) => e.name === 'Hero')
    const person = ir.entities.find((e: IREntity) => e.name === 'Person')

    expect(hero).toBeDefined()
    expect(hero!.isImplicit).toBe(false)

    expect(person).toBeDefined()
    expect(person!.isImplicit).toBe(true)

    // Relationship should be present and resolved
    expect(ir.relationships).toHaveLength(1)
    expect(ir.relationships[0].from).toBe('Hero')
    expect(ir.relationships[0].to).toBe('Person')
    expect(ir.relationships[0].type).toBe(IRRelationshipType.INHERITANCE)
  })

  it('should resolve FQNs correctly in nested packages', () => {
    const input = `
      package core {
        class User {}
        package domain {
          class Profile >> User {}
        }
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const ir = analyzer.analyze(ast, reporter)

    const user = ir.entities.find((e: IREntity) => e.id === 'core.User')
    const profile = ir.entities.find((e: IREntity) => e.id === 'core.domain.Profile')

    expect(user).toBeDefined()
    expect(profile).toBeDefined()

    expect(ir.relationships[0].from).toBe('core.domain.Profile')
    expect(ir.relationships[0].to).toBe('core.User')
  })

  it('should handle standalone relationships creating implicits', () => {
    const input = 'A >> B'
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const ir = analyzer.analyze(ast, reporter)

    expect(ir.entities).toHaveLength(2)
    expect(ir.entities.every((e) => e.isImplicit)).toBe(true)
    expect(ir.relationships).toHaveLength(1)
  })

  it('should create multiple relationships to same type with different roles', () => {
    const input = `
      interface IRMember {}
      interface DiagramNode {
        + attributes: >* IRMember
        + methods: >* IRMember
      }
    `
    const tokens = LexerFactory.create(input).tokenize()
    const parser = ParserFactory.create()
    const ast = parser.parse(tokens)

    const analyzer = new SemanticAnalyzer()
    const reporter = new DiagnosticReporter()
    const ir = analyzer.analyze(ast, reporter)

    // Should have 2 relationships from DiagramNode to IRMember
    const rels = ir.relationships.filter(
      (r: IRRelationship) =>
        r.from === 'DiagramNode' &&
        r.to === 'IRMember' &&
        r.type === IRRelationshipType.COMPOSITION,
    )

    expect(rels).toHaveLength(2)
    expect(rels.map((r: IRRelationship) => r.label).sort()).toEqual(['attributes', 'methods'])
  })
})
