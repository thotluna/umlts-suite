#!/usr/bin/env node
/* eslint-disable no-console */
import { Command } from 'commander'
import { BlueprintExtractor } from './extractor'
import * as path from 'path'
import * as fs from 'fs'

const program = new Command()

program
  .name('umlts-blueprint')
  .description('Reverse engineering tool to generate UMLTS diagrams from TypeScript code.')
  .version('0.1.0')
  .argument('<path>', 'Source files path (glob pattern, e.g., "src/**/*.ts")')
  .option('-o, --output <file>', 'Output .umlts file')
  .option('--exclude <patterns...>', 'Exclude patterns')
  .action((globPath, options) => {
    const extractor = new BlueprintExtractor()

    // Resolve path relative to current working directory
    const resolvedPath = path.isAbsolute(globPath) ? globPath : path.join(process.cwd(), globPath)

    console.log(`🔍 Scanning: ${resolvedPath}`)

    try {
      extractor.addSourceFiles(resolvedPath)
      const umlts = extractor.extract()

      if (options.output) {
        const outputPath = path.isAbsolute(options.output)
          ? options.output
          : path.join(process.cwd(), options.output)

        fs.writeFileSync(outputPath, umlts)
        console.log(`✅ Success! Diagram generated at: ${outputPath}`)
      } else {
        console.log('\n--- GENERATED UMLTS ---\n')
        console.log(umlts)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`❌ Error scanning files: ${message}`)
      process.exit(1)
    }
  })

program.parse()
