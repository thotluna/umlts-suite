import * as fs from 'fs'
import * as path from 'path'
import fg from 'fast-glob'
import { SourceProvider, SourceUnit } from '../types'

/**
 * Provider responsible for discovering files in the local file system.
 * Handles both absolute and relative paths/glob patterns.
 */
export class FileSystemProvider implements SourceProvider {
  /**
   * Identifica si la entrada es una ruta del sistema de archivos (absoluta o relativa)
   * o un patrón glob de búsqueda local.
   */
  public canHandle(input: string): boolean {
    return path.isAbsolute(input) || input.startsWith('.') || this.isLocalPattern(input)
  }

  private isLocalPattern(input: string): boolean {
    // Consideramos local cualquier path que no sea un esquema de URI (sin "://")
    // y que pueda contener caracteres de glob (*, ?, [, {)
    const hasProtocol = input.includes('://')
    return !hasProtocol
  }

  public async lookup(input: string): Promise<SourceUnit[]> {
    const searchPattern = this.resolvePath(input)

    const files = fg.sync(searchPattern, {
      absolute: true,
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    })

    return files.map((file) => {
      const stats = fs.statSync(file)
      return {
        uri: file,
        name: path.basename(file),
        size: stats.size,
      }
    })
  }

  private resolvePath(input: string): string {
    if (path.isAbsolute(input)) {
      return input
    }
    return path.join(process.cwd(), input)
  }
}
