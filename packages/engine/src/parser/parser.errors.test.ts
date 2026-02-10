import { describe, it, expect } from 'vitest';
import { LexerFactory } from '../lexer/lexer.factory';
import { ParserFactory } from './parser.factory';
import { ASTNodeType } from './ast/nodes';

describe('Parser Error Handling', () => {
  it('should report error for unrecognized statement and continue', () => {
    const input = `
      class User {}
      invalid statement here
      class Post {}
    `;
    const tokens = LexerFactory.create(input).tokenize();
    const parser = ParserFactory.create();
    const ast = parser.parse(tokens);

    expect(ast.body).toHaveLength(2);
    expect(ast.body[0]!.type).toBe(ASTNodeType.CLASS);
    expect(ast.body[1]!.type).toBe(ASTNodeType.CLASS);

    expect(ast.diagnostics).toBeDefined();
    expect(ast.diagnostics!.length).toBeGreaterThan(0);
    expect(ast.diagnostics![0]!.message).toContain("Sentencia no reconocida");
  });

  it('should recover from an error inside a package', () => {
    const input = `
      package core {
        class Valid {}
        invalid
        class AlsoValid {}
      }
    `;
    const tokens = LexerFactory.create(input).tokenize();
    const parser = ParserFactory.create();
    const ast = parser.parse(tokens);

    const pkg = ast.body[0] as any;
    expect(pkg.body).toHaveLength(2);
    expect(pkg.body[0]!.type).toBe(ASTNodeType.CLASS);
    expect(pkg.body[1]!.type).toBe(ASTNodeType.CLASS);
  });
});
