# 🧪 Implementación: Capa Léxica (Lexer) - Profiles & Stereotypes

Este documento detalla los cambios realizados en el Lexer para soportar la sintaxis de Perfiles y Estereotipos.

## 1. Definición de Tokens (`packages/engine/src/syntax/token.types.ts`)

Se han añadido los siguientes tipos de tokens:

```typescript
export enum TokenType {
  // ...
  AT = 'AT', // @ (Uso: @entity)
  LBRACKET = 'LBRACKET', // [ (Uso: [ table="users" ])
  RBRACKET = 'RBRACKET', // ]
  EQUALS = 'EQUALS', // = (Uso: key="value")

  // Keywords de Perfiles y Estereotipos
  KW_PROFILE = 'KW_PROFILE', // profile
  KW_STEREOTYPE = 'KW_STEREOTYPE', // stereotype
}
```

## 2. Reconocimiento de Palabras Clave (`packages/engine/src/lexer/matchers/general.identifier.matcher.ts`)

Las palabras clave se han registrado en el `GeneralIdentifierMatcher` para asegurar que se identifiquen antes que los identificadores genéricos.

```typescript
private readonly KEYWORDS: Record<string, TokenType> = {
  // ... existentes
  profile: TokenType.KW_PROFILE,
  stereotype: TokenType.KW_STEREOTYPE,
}
```

## 3. Reconocimiento de Símbolos (`packages/engine/src/lexer/matchers/simple.symbol.matcher.ts`)

Se han registrado los símbolos unitarios:

```typescript
private readonly SYMBOLS: Record<string, TokenType> = {
  // ...
  '[': TokenType.LBRACKET,
  ']': TokenType.RBRACKET,
  '@': TokenType.AT,
  '=': TokenType.EQUALS,
}
```

## 4. Verificación y Orden de Prioridad

Es CRÍTICO que los matchers de símbolos y palabras clave se ejecuten antes que el matcher de identificadores. En el sistema actual, el `SymbolMatcher` y el `GeneralIdentifierMatcher` se encargan de esto de forma jerárquica.

### Pruebas de Verificación:

- `@trace` -> `AT`, `IDENTIFIER("trace")`
- `[ table="users" ]` -> `LBRACKET`, `IDENTIFIER("table")`, `EQUALS`, `STRING("users")`, `RBRACKET`
- `profile MyProfile` -> `KW_PROFILE`, `IDENTIFIER("MyProfile")`
