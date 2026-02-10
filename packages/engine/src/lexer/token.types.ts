export enum TokenType {
  // Keywords
  KW_CLASS = 'KW_CLASS',
  KW_INTERFACE = 'KW_INTERFACE',
  KW_ENUM = 'KW_ENUM',
  KW_PACKAGE = 'KW_PACKAGE',
  KW_PUBLIC = 'KW_PUBLIC',
  KW_PRIVATE = 'KW_PRIVATE',
  KW_PROTECTED = 'KW_PROTECTED',
  KW_INTERNAL = 'KW_INTERNAL',
  KW_STATIC = 'KW_STATIC',
  KW_ABSTRACT = 'KW_ABSTRACT',
  KW_EXTENDS = 'KW_EXTENDS',
  KW_IMPLEMENTS = 'KW_IMPLEMENTS',
  KW_COMP = 'KW_COMP',
  KW_AGREG = 'KW_AGREG',
  KW_USE = 'KW_USE',
  KW_ACTIVE = 'KW_ACTIVE',

  // Operators and Symbols
  OP_INHERIT = 'OP_INHERIT',      // >>
  OP_IMPLEMENT = 'OP_IMPLEMENT',  // >I
  OP_COMP = 'OP_COMP',            // >*
  OP_AGREG = 'OP_AGREG',          // >+
  OP_USE = 'OP_USE',              // >-
  OP_GENERIC_REL = 'OP_GENERIC_REL', // >
  LT = 'LT',                      // <
  GT = 'GT',                      // >

  LBRACE = 'LBRACE',              // {
  RBRACE = 'RBRACE',              // }
  LPAREN = 'LPAREN',              // (
  RPAREN = 'RPAREN',              // )
  LBRACKET = 'LBRACKET',          // [
  RBRACKET = 'RBRACKET',          // ]
  COLON = 'COLON',                // :
  COMMA = 'COMMA',                // ,
  DOT = 'DOT',                    // .
  RANGE = 'RANGE',                // ..
  PIPE = 'PIPE',                  // |
  STAR = 'STAR',                  // *

  VIS_PUB = 'VIS_PUB',            // +
  VIS_PRIV = 'VIS_PRIV',          // -
  VIS_PROT = 'VIS_PROT',          // #
  VIS_PACK = 'VIS_PACK',          // ~

  MOD_STATIC = 'MOD_STATIC',      // $
  MOD_ABSTRACT = 'MOD_ABSTRACT',  // *
  MOD_ACTIVE = 'MOD_ACTIVE',      // &

  // Identifiers and Literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',

  // Others
  COMMENT = 'COMMENT',
  DOC_COMMENT = 'DOC_COMMENT',
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
