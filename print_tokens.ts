import { LexerFactory } from './packages/engine/src/lexer/lexer.factory.ts'

async function main() {
  const input = `    + status: > SubscriptionStatus(ACTIVE | CANCELLED | EXPIRED)`
  console.log('Input:', input)

  const lexer = LexerFactory.create(input)
  const tokens = lexer.tokenize()

  console.log('Tokens:')
  tokens.forEach((t) => {
    console.log(`${t.type} (${t.value}) at column ${t.column}`)
  })
}

main().catch(console.error)
