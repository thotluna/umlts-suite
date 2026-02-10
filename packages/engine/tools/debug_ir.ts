import { UMLEngine } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso: npx tsx tools/debug_ir.ts <archivo.umlts>');
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

  // El engine.parse ya devuelve el diagrama en IR
  const result = engine.parse(source);

  if (!result.isValid) {
    console.error('El código fuente contiene errores:');
    result.diagnostics.forEach(d => {
      console.error(`[${d.line}:${d.column}] ${d.message}`);
    });
  }

  if (result.diagram) {
    console.log(JSON.stringify(result.diagram, null, 2));
  }
}

main();
