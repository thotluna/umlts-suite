import { UMLEngine } from './packages/engine/src/index.ts'
import type { Diagnostic } from './packages/engine/src/parser/diagnostic.types.ts'
import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const filePath = path.resolve(
    '/home/thot/proyects/umlts-suite/packages/blueprint/motor-surgeon.umlts',
  )
  const input = fs.readFileSync(filePath, 'utf-8')

  const engine = new UMLEngine()
  const result = engine.parse(input)

  if (result.diagnostics && result.diagnostics.length > 0) {
    console.log('Diagnostics:')
    result.diagnostics.forEach((d: Diagnostic) => {
      console.log(`${d.message} at line ${d.line}, column ${d.column}`)
    })
  } else {
    console.log('No diagnostics found.')
  }
}

main().catch(console.error)
