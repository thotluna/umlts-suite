import { SurgeonExtractor } from './extractor'
import * as path from 'path'
import * as fs from 'fs'

const extractor = new SurgeonExtractor()
const targetDir = path.resolve(__dirname, '../../../engine/src/semantics')

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const filePath = path.join(dir, file)
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList)
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      fileList.push(filePath)
    }
  })
  return fileList
}

try {
  console.log('🧪 Testing Surgeon Extractor on semantics package (RECURSIVE)\n')

  const allFiles = getAllFiles(targetDir)
  allFiles.forEach((file) => {
    extractor.scanFile(file)
  })

  const output = extractor.getOutput()
  const outputPath = path.resolve(__dirname, '../../motor-surgeon.umlts')
  fs.writeFileSync(outputPath, output)

  console.log(`✅ Extraction complete. Saved to: ${outputPath}`)
} catch (error) {
  console.error('❌ Error during extraction:', error)
}
