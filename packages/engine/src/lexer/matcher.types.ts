import type { Token } from './token.types';
import type { LexerReader } from './lexer.reader';

export interface TokenMatcher {
  /**
   * Intenta encontrar una coincidencia para un token en la posición actual del reader.
   * Si hay coincidencia, consume los caracteres necesarios y devuelve el Token.
   * Si no hay coincidencia, DEBE devolver null y NO consumir nada (o hacer rollback).
   */
  match(reader: LexerReader): Token | null;
}
