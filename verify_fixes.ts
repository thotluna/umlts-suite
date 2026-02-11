
import { LexerFactory } from './packages/engine/src/lexer/lexer.factory.ts';
import { ParserContext } from './packages/engine/src/parser/parser.context.ts';
import { EntityRule } from './packages/engine/src/parser/rules/entity.rule.ts';
import { SemanticAnalyzer } from './packages/engine/src/semantics/analyzer.ts';
import { ProgramNode, ASTNodeType } from './packages/engine/src/parser/ast/nodes.ts';

const code = `
class hijo >> * Padre {
    nombre: string
    $estatico: string
}

*class AbstractaSola

$class EstaticaSola {

}

* class AbstractaConEspacio
$ class EstaticaConEspacio
`;

async function test() {
  console.log("--- Testing Abstract/Static Fixes ---");

  const lexer = LexerFactory.create(code);
  const tokens = lexer.tokenize();
  const context = new ParserContext(tokens);

  // Simulating a full parse by manually calling the body rules or just entity rule in a loop
  const entityRule = new EntityRule();
  const body: any[] = [];

  while (!context.isAtEnd()) {
    const entity = entityRule.parse(context);
    if (entity) {
      body.push(entity);
    } else {
      context.advance(); // Skip unknowns if any
    }
  }

  const program: ProgramNode = {
    type: ASTNodeType.PROGRAM,
    body,
    line: 1,
    column: 1
  };

  const analyzer = new SemanticAnalyzer();
  const ir = analyzer.analyze(program);

  console.log("Entities in IR:");
  ir.entities.forEach(e => {
    console.log(`- ${e.id}: Abstract=${e.isAbstract}, Static=${e.isStatic}, Implicit=${e.isImplicit}`);
    e.members.forEach(m => {
      if (m.isStatic) console.log(`  * Member ${m.name}: Static=true`);
    });
  });

  // Verification
  const find = (id: string) => ir.entities.find(e => e.id === id);

  const errors = [];
  if (!find('Padre')?.isAbstract) errors.push("Padre should be abstract (from relationship)");
  if (!find('hijo')?.members.find(m => m.name === 'estatico')?.isStatic) errors.push("estatico member should be static");
  if (!find('AbstractaSola')?.isAbstract) errors.push("AbstractaSola should be abstract (*class)");
  if (!find('EstaticaSola')?.isStatic) errors.push("EstaticaSola should be static ($class)");
  if (!find('AbstractaConEspacio')?.isAbstract) errors.push("AbstractaConEspacio should be abstract (* class)");
  if (!find('EstaticaConEspacio')?.isStatic) errors.push("EstaticaConEspacio should be static ($ class)");

  if (errors.length === 0) {
    console.log("\n✅ ALL TESTS PASSED!");
  } else {
    console.log("\n❌ TESTS FAILED:");
    errors.forEach(err => console.error(`- ${err}`));
  }
}

test().catch(console.error);
