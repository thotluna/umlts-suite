# 🧪 Implementación: Capa Léxica (Lexer)

Este documento detalla los cambios exactos para habilitar los tokens de Perfiles, Estereotipos y Tagged Values.

## 1. Definición de Tokens (`packages/engine/src/syntax/token.types.ts`)

Añadir los nuevos tipos de tokens al enum `TokenType`:

```typescript
export enum TokenType {
  // ... existentes
  AT = 'AT', // @
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]

  // Keywords de Perfiles
  PROFILE = 'PROFILE', // profile
  STEREOTYPE = 'STEREOTYPE', // stereotype
  EXTENDS = 'EXTENDS', // extends

  // Tipos de datos para Tagged Values
  NUMBER = 'NUMBER', // Para Integer/Float
  // ...
}
```

## 2. Configuración de Matchers (`packages/engine/src/lexer/lexer.factory.ts`)

Registrar los patrones para que el Lexer reconozca los nuevos símbolos y palabras clave:

```typescript
// Símbolos unitarios
{ pattern: /^@/, type: TokenType.AT },
{ pattern: /^\[/, type: TokenType.LBRACKET },
{ pattern: /^\]/, type: TokenType.RBRACKET },

// Palabras clave (asegurar que se evalúen antes que IDENTIFIER)
{ pattern: /^profile\b/, type: TokenType.PROFILE },
{ pattern: /^stereotype\b/, type: TokenType.STEREOTYPE },
{ pattern: /^extends\b/, type: TokenType.EXTENDS },
```

## 3. Guía de Acción

1. **Actualizar `token.types.ts`**: Insertar los nuevos enums.
2. **Actualizar `lexer.factory.ts`**: Añadir los matchers en el orden de prioridad correcto (keywords antes que identificadores genéricos).
3. **Verificación**: Ejecutar el lexer con el input `@entity [ table="users" ]` y verificar que genera la secuencia: `AT`, `IDENTIFIER`, `LBRACKET`, `IDENTIFIER`, `EQUALS`, `STRING`, `RBRACKET`.
