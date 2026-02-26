---
title: Blueprint Extractor
description: Ingeniería inversa para generar diagramas desde código TypeScript.
---

**Blueprint** es la herramienta de ingeniería inversa de la suite. Su propósito es extraer la arquitectura de un proyecto TypeScript ya existente y convertirla en el DSL de UMLTS.

## ¿Cómo funciona?

Analiza el código usando el compilador de TypeScript para identificar:

1. Clases, Interfaces y sus Herencias.
2. Atributos y Métodos (detectando visibilidad y tipos).
3. Relaciones implícitas entre archivos.

## Uso por API

Si quieres integrar la extracción en tus propias herramientas, puedes usar el paquete `@umlts/blueprint`.

```typescript
import { BlueprintExtractor } from '@umlts/blueprint'

const extractor = new BlueprintExtractor()

// Extrae la arquitectura de un conjunto de archivos
const result = await extractor.extract(['./src/**/*.ts'])

// 'result' contiene el código en el DSL de UMLTS listo para ser editado o renderizado
console.log(result.code)
```

## Ventajas

- **Documentación Viva**: Mantén tus diagramas sincronizados con el código real sin esfuerzo manual.
- **Auditoría**: Visualiza rápidamente deudas técnicas o dependencias circulares en un proyecto heredado.
- **Migración**: Úsalo para crear la base de tus archivos `.umlts` y luego refinarlos manualmente.
