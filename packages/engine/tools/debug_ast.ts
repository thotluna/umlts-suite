import { LexerFactory } from '../src/lexer/lexer.factory';
import { ParserFactory } from '../src/parser/parser.factory';
import * as fs from 'fs';
import * as path from 'path';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso: npx tsx tools/debug_ast.ts <archivo.umlts>');
    process.exit(1);
  }

  const fileName = args[0]!;
  const filePath = path.resolve(fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: El archivo "${filePath}" no existe.`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');

  // 1. Lexer
  const lexer = LexerFactory.create(source);
  const tokens = lexer.tokenize();

  // 2. Parser
  const parser = ParserFactory.create();
  const ast = parser.parse(tokens);

  // 3. Output AST as JSON
  console.log(JSON.stringify(ast, null, 2));
}

main();
