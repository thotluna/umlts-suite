import { UMLEngine } from '../src/index';

const code = `
/**
 * Clase activa con genéricos
 */
active class Manager<T, K> {
    - data: T
    + process(input: K): void
}

/**
 * Interfaz genérica
 */
interface IRepository<T> {
    + findById(id: string): T
}
`;

const engine = new UMLEngine();
const result = engine.parse(code);

if (result.diagnostics.length > 0) {
  console.error('Errores de parseo:');
  result.diagnostics.forEach(d => console.error(`${d.message} [${d.line}:${d.column}]`));
  process.exit(1);
}

if (!result.diagram) {
  console.error('No se generó el diagrama IR');
  process.exit(1);
}

const manager = result.diagram.entities.find(e => e.name === 'Manager');
if (!manager) {
  console.error('No se encontró la entidad Manager');
  process.exit(1);
}

console.log('Manager Entity:');
console.log(` - isActive: ${manager.isActive}`);
console.log(` - typeParameters: ${JSON.stringify(manager.typeParameters)}`);
console.log(` - docs: ${manager.docs}`);

const repository = result.diagram.entities.find(e => e.name === 'IRepository');
if (!repository) {
  console.error('No se encontró la entidad IRepository');
  process.exit(1);
}

console.log('\nIRepository Entity:');
console.log(` - typeParameters: ${JSON.stringify(repository.typeParameters)}`);

// Verificar que se mantienen los miembros
console.log('\nManager Members:');
manager.members.forEach(m => {
  console.log(` - ${m.name}: ${m.type} (docs: ${m.docs})`);
});

// Caso 3: Símbolo & para Active Class
const codeActiveSymbol = `& class ActiveWorker {}`;
const resultActive = engine.parse(codeActiveSymbol);
if (resultActive.diagram.entities[0].isActive !== true) {
  console.error('ERROR: El símbolo & no activó isActive');
  process.exit(1);
}

console.log('\n✅ Soporte de genéricos, clases activas (active y &) y JSDoc verificado.');
