/**
 * Tipos de tokens atómicos.
 */
export enum TokenType {
  KEYWORD = 'KEYWORD',
  IDENTIFIER = 'IDENTIFIER',
  SYMBOL = 'SYMBOL',
  IMPORT = 'IMPORT',
  STRING = 'STRING',
}

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}

export interface TokenMatcher {
  readonly type: TokenType
  match(text: string): string | null
}
