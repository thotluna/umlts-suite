import { UMLEngine } from '@umlts/engine'
import { TypeScriptPlugin } from '@umlts/plugin-ts'
import { Command } from 'commander'
import * as fs from 'fs'
import * as path from 'path'

const program = new Command()

program.name('umlts').description('CLI to parse and generate IR from .umlts files').version('1.0.0')

program
  .command('parse')
  .description('Parse a .umlts file and output the Intermediate Representation (IR)')
  .argument('<file>', 'Path to the .umlts file')
  .option('-o, --output <path>', 'Output path for the generated JSON')
  .action((file, options) => {
    const filePath = path.resolve(file)

    if (!fs.existsSync(filePath)) {
      console.error(`Error: File "${filePath}" not found.`)
      process.exit(1)
    }

    const source = fs.readFileSync(filePath, 'utf-8')

    // Inject the TypeScript plugin into the engine
    const engine = new UMLEngine([new TypeScriptPlugin()])
    const result = engine.parse(source)

    if (!result.isValid) {
      console.error('The source code contains errors:')
      result.diagnostics.forEach((d) => {
        console.error(`[${d.line}:${d.column}] ${d.message}`)
      })
      process.exit(1)
    }

    const irJson = JSON.stringify(result.diagram, null, 2)

    if (options.output) {
      const outputPath = path.resolve(options.output)
      fs.writeFileSync(outputPath, irJson)
      console.log(`IR generated successfully at: ${outputPath}`)
    } else {
      console.log(irJson)
    }
  })

program.parse()
