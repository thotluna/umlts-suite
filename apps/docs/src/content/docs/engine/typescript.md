---
title: Plugin TypeScript
description: Potencia el motor de UMLTS con el sistema de tipos de TypeScript.
---

El `@umlts/plugin-ts` permite que el motor entienda y valide tipos específicos de TypeScript, mejorando la inferencia de tipos y la validación semántica.

## ¿Qué aporta?

Aunque el DSL de UMLTS está inspirado en TS, el plugin añade lógica específica:

- **Reserva de Tipos**: Reconoce tipos primitivos de TS (`string`, `number`, `boolean`, `any`, `unknown`) y los marca como tipos base.
- **Inferencia Avanzada**: Ayuda a distinguir cuándo una relación debería ser de asociación o agregación basándose en el uso del tipo en un atributo.
- **Validación Estricta**: Avisa si intentas usar un tipo que no existe o que no es compatible según las reglas de TS.

## Instalación y Configuración

El plugin se inyecta directamente en el constructor del motor:

```typescript
import { UMLEngine } from '@umlts/engine'
import { TSPlugin } from '@umlts/plugin-ts'

// Configura el motor con soporte para tipos de TS
const engine = new UMLEngine([new TSPlugin()])
```

## ¿Es interno o externo?

Es una parte **integral** del ecosistema aunque viva en un paquete separado. Se recomienda usarlo siempre que el modelado esté orientado a implementaciones en TypeScript para obtener la mejor experiencia de validación.
