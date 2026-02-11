
const { LexerFactory } = require('./packages/engine/dist/lexer/lexer.factory');
const { ParserContext } = require('./packages/engine/dist/parser/parser.context');
const { EntityRule } = require('./packages/engine/dist/parser/rules/entity.rule');
const { SemanticAnalyzer } = require('./packages/engine/dist/semantics/analyzer');
const { ASTNodeType } = require('./packages/engine/dist/parser/ast/nodes');

const code = `
class hijo >> * Padre {
    nombre: string
    $estatico: string
}

$class otherTheOTher { }
`;

async function test() {
  console.log("--- Testing Abstract/Static Fixes ---");

  try {
    const lexer = LexerFactory.create(code);
    const tokens = lexer.tokenize();
    const context = new ParserContext(tokens);

    const entityRule = new EntityRule();
    const body = [];

    while (!context.isAtEnd()) {
      const entity = entityRule.parse(context);
      if (entity) {
        body.push(entity);
      } else {
        context.advance();
      }
    }

    const program = {
      type: ASTNodeType.PROGRAM,
      body,
      line: 1,
      column: 1
    };

    const analyzer = new SemanticAnalyzer();
    const ir = analyzer.analyze(program);

    console.log("Entities in IR:");
    ir.entities.forEach(e => {
      console.log(`- ${e.id}: Abstract=${e.isAbstract}, Static=${e.isStatic}`);
      e.members.forEach(m => {
        if (m.isStatic) console.log(`  * Member ${m.name}: Static=${m.isStatic}`);
      });
    });

    const hijo = ir.entities.find(e => e.id === 'hijo');
    const estaticoMember = hijo.members.find(m => m.name === 'estatico');

    if (estaticoMember && estaticoMember.isStatic) {
      console.log("\n✅ Attribute $estatico parsed correctly as static!");
    } else {
      console.log("\n❌ Attribute $estatico NOT parsed as static!");
    }

    const other = ir.entities.find(e => e.id === 'otherTheOTher');
    if (other && other.isStatic) {
      console.log("✅ Class $class otherTheOTher parsed correctly as static!");
    } else {
      console.log("❌ Class $class otherTheOTher NOT parsed as static!");
    }

  } catch (err) {
    console.error("Error during test:", err);
  }
}

test();
