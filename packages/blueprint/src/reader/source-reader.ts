import * as fs from 'fs'
import * as readline from 'readline'

/**
 * Encapsula la lectura de un archivo de forma lineal.
 */
export class SourceReader {
  private rl: readline.Interface | null = null
  private iterator: AsyncIterableIterator<string> | null = null

  /**
   * Abre un archivo para lectura.
   */
  public open(uri: string): void {
    const fileStream = fs.createReadStream(uri)
    this.rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    })
    this.iterator = this.rl[Symbol.asyncIterator]()
  }

  /**
   * Devuelve la siguiente línea del archivo o null si terminó.
   */
  public async readNext(): Promise<string | null> {
    if (!this.iterator) return null

    const result = await this.iterator.next()
    if (result.done) {
      this.close()
      return null
    }
    return result.value
  }

  private close(): void {
    if (this.rl) {
      this.rl.close()
      this.rl = null
      this.iterator = null
    }
  }
}
