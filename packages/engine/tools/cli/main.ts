import { UMLEngine } from '../../src/index'
import * as fs from 'fs'
import * as path from 'path'

function main() {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log('Uso: npm run generate <archivo.umlts>')
    process.exit(1)
  }

  const fileName = args[0]
  const filePath = path.resolve(fileName)

  if (!fs.existsSync(filePath)) {
    console.error(`Error: El archivo "${filePath}" no existe.`)
    process.exit(1)
  }

  const source = fs.readFileSync(filePath, 'utf-8')
  const engine = new UMLEngine()

  const result = engine.parse(source)

  if (result.isValid) {
    console.log('El archivo es válido.')
    // console.log(JSON.stringify(result.diagram, null, 2))
  } else {
    console.error('El código fuente contiene errores:')
    result.diagnostics.forEach((d) => {
      console.error(`[${d.line}:${d.column}] ${d.message}`)
    })
    process.exit(1)
  }
}

main()
