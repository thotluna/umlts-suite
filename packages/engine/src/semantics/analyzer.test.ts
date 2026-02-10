import { describe, it, expect } from 'vitest';
import { LexerFactory } from '../lexer/lexer.factory';
import { ParserFactory } from '../parser/parser.factory';
import { SemanticAnalyzer } from './analyzer';
import { IRRelationshipType } from '../generator/ir/models';

describe('SemanticAnalyzer', () => {
  it('should create an implicit entity when a relationship target is missing', () => {
    const input = 'class Hero >> Person {}';
    const tokens = LexerFactory.create(input).tokenize();
    const parser = ParserFactory.create();
    const ast = parser.parse(tokens);

    const analyzer = new SemanticAnalyzer();
    const ir = analyzer.analyze(ast);

    // Debe haber 2 entidades: Hero (explícita) y Person (implícita)
    expect(ir.entities).toHaveLength(2);

    const hero = ir.entities.find(e => e.name === 'Hero');
    const person = ir.entities.find(e => e.name === 'Person');

    expect(hero).toBeDefined();
    expect(hero!.isImplicit).toBe(false);

    expect(person).toBeDefined();
    expect(person!.isImplicit).toBe(true);

    // La relación debe estar presente y resuelta
    expect(ir.relationships).toHaveLength(1);
    expect(ir.relationships[0]!.from).toBe('Hero');
    expect(ir.relationships[0]!.to).toBe('Person');
    expect(ir.relationships[0]!.type).toBe(IRRelationshipType.INHERITANCE);
  });

  it('should resolve FQNs correctly in nested packages', () => {
    const input = `
      package core {
        class User {}
        package domain {
          class Profile >> User {}
        }
      }
    `;
    const tokens = LexerFactory.create(input).tokenize();
    const parser = ParserFactory.create();
    const ast = parser.parse(tokens);

    const analyzer = new SemanticAnalyzer();
    const ir = analyzer.analyze(ast);

    const user = ir.entities.find(e => e.id === 'core.User');
    const profile = ir.entities.find(e => e.id === 'core.domain.Profile');

    expect(user).toBeDefined();
    expect(profile).toBeDefined();

    expect(ir.relationships[0]!.from).toBe('core.domain.Profile');
    expect(ir.relationships[0]!.to).toBe('core.User');
  });

  it('should handle standalone relationships creating implicits', () => {
    const input = 'A >> B';
    const tokens = LexerFactory.create(input).tokenize();
    const parser = ParserFactory.create();
    const ast = parser.parse(tokens);

    const analyzer = new SemanticAnalyzer();
    const ir = analyzer.analyze(ast);

    expect(ir.entities).toHaveLength(2);
    expect(ir.entities.every(e => e.isImplicit)).toBe(true);
    expect(ir.relationships).toHaveLength(1);
  });
});
