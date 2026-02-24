/**
 * Utility to perform a fast initial scan of the source code to detect
 * configurations (like the language) before the main compilation process.
 */
export class ConfigPreScanner {
  /**
   * Scans the source for a 'language' configuration and returns its value.
   * Supports both block syntax: config { language: "ts" }
   * and line syntax: @language: "ts"
   */
  public static scanLanguage(source: string): string | undefined {
    // 1. Line syntax: @language: "value" or @language: value
    const lineRegex = /@language\s*:\s*["']?(\w+)["']?/i
    const lineMatch = lineRegex.exec(source)
    if (lineMatch) {
      return lineMatch[1]
    }

    // 2. Block syntax: config { ... language: "value" ... }
    // We look for a config block and extract the language within it
    const blockRegex = /config\s*\{([\s\S]*?)\}/gi
    let match: RegExpExecArray | null

    while ((match = blockRegex.exec(source)) !== null) {
      const blockContent = match[1]
      const langInsideRegex = /language\s*:\s*["']?(\w+)["']?/i
      const langMatch = langInsideRegex.exec(blockContent)
      if (langMatch) {
        return langMatch[1]
      }
    }

    return undefined
  }
}
