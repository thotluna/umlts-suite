import { BlueprintExtractor } from './extractor'
import * as path from 'path'

async function main() {
  const extractor = new BlueprintExtractor()

  // Example: analize the engine semantics package
  const targetPath = path.resolve(__dirname, '../../engine/src/semantics/*.ts')
  console.log(`Analyzing: ${targetPath}`)

  extractor.addSourceFiles(targetPath)
  const umlts = extractor.extract()

  console.log('--- GENERATED UMLTS ---')
  console.log(umlts)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
