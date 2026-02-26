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
  KW_ASSOC = 'KW_ASSOC',
  KW_USE = 'KW_USE',
  KW_ACTIVE = 'KW_ACTIVE',
  KW_CONFIG = 'KW_CONFIG',
  KW_LEAF = 'KW_LEAF',
  KW_FINAL = 'KW_FINAL',
  KW_ROOT = 'KW_ROOT',
  KW_XOR = 'KW_XOR',
  KW_NOTE = 'KW_NOTE',
  KW_DERIVED = 'KW_DERIVED',
  KW_READONLY = 'KW_READONLY',
  KW_ASYNC = 'KW_ASYNC',
  KW_TYPE = 'KW_TYPE',
  KW_NAMESPACE = 'KW_NAMESPACE',
  AT = 'AT', // @

  // Operators and Symbols
  OP_INHERIT = 'OP_INHERIT', // >>
  OP_IMPLEMENT = 'OP_IMPLEMENT', // >I
  OP_COMP = 'OP_COMP', // >*
  OP_AGREG = 'OP_AGREG', // >+
  OP_USE = 'OP_USE', // >-
  OP_ASSOC = 'OP_ASSOC', // ><
  OP_ASSOC_BIDIR = 'OP_ASSOC_BIDIR', // <>
  OP_COMP_NON_NAVIGABLE = 'OP_COMP_NON_NAVIGABLE', // >*|
  OP_AGREG_NON_NAVIGABLE = 'OP_AGREG_NON_NAVIGABLE', // >+|

  GT = 'GT', // >
  LT = 'LT', // <
  QUESTION = 'QUESTION', // ?
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  COLON = 'COLON', // :
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .
  RANGE = 'RANGE', // ..
  PIPE = 'PIPE', // |
  STAR = 'STAR', // *
  EXCLAMATION = 'EXCLAMATION', // !
  EQUALS = 'EQUALS', // =

  VIS_PUB = 'VIS_PUB', // +
  VIS_PRIV = 'VIS_PRIV', // -
  VIS_PROT = 'VIS_PROT', // #
  VIS_PACK = 'VIS_PACK', // ~

  MOD_STATIC = 'MOD_STATIC', // $
  MOD_ABSTRACT = 'MOD_ABSTRACT', // *
  MOD_ACTIVE = 'MOD_ACTIVE', // &
  MOD_LEAF = 'MOD_LEAF', // !
  MOD_ROOT = 'MOD_ROOT', // ^
  MOD_ASYNC = 'MOD_ASYNC', // ~ or some token, but for now just from keyword

  // Identifiers and Literals
  IDENTIFIER = 'IDENTIFIER',
  NUMBER = 'NUMBER',
  STRING = 'STRING',

  // Others
  COMMENT = 'COMMENT',
  DOC_COMMENT = 'DOC_COMMENT',
  EOF = 'EOF',
  UNKNOWN = 'UNKNOWN',
}

export interface Token {
  type: TokenType
  value: string
  line: number
  column: number
}
