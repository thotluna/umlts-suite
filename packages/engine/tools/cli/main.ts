import { UMLEngine } from '../../src/index';
import { MermaidGenerator } from '../../src/generator/mermaid.generator';
import * as fs from 'fs';
import * as path from 'path';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso: npm run generate <archivo.umlts>');
    process.exit(1);
  }

  const fileName = args[0]!;
  const filePath = path.resolve(fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: El archivo "${filePath}" no existe.`);
    process.exit(1);
  }

  const source = fs.readFileSync(filePath, 'utf-8');
  const engine = new UMLEngine();
  const generator = new MermaidGenerator();

  const result = engine.parse(source);

  if (result.isValid) {
    const mermaidCode = generator.generate(result.diagram);
    console.log(mermaidCode);
  } else {
    console.error('El código fuente contiene errores:');
    result.diagnostics.forEach(d => {
      console.error(`[${d.line}:${d.column}] ${d.message}`);
    });
    process.exit(1);
  }
}

main();
