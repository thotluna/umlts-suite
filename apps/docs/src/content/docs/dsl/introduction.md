---
title: ¿Qué es UMLTS?
description: El razonamiento detrás del lenguaje UMLTS y sus objetivos.
---

**UMLTS** (Unified Modeling Language - TypeScript Syntax) es un lenguaje de modelado textual diseñado para desarrolladores que buscan documentar arquitecturas de software sin abandonar su entorno de desarrollo.

## ¿Por qué existe?

Tradicionalmente, el modelado UML se ha hecho con herramientas visuales de "arrastrar y soltar". Esto presenta varios problemas:

1. **Desacoplamiento**: El diagrama vive en un archivo binario separado del código.
2. **Dificultad de Versionado**: Es casi imposible ver diferencias (`diffs`) significativas en Git.
3. **Fricción**: Mover una flecha puede tomar más tiempo que definir la relación.

UMLTS resuelve esto permitiéndote escribir tus diagramas como si fueran código.

## ¿Qué es exactamente?

Es un **DSL (Domain Specific Language)** con una sintaxis familiar para cualquier desarrollador de TypeScript. No es solo "dibujar cajas"; el sistema entiende la semántica de UML 2.5.1:

- Si defines una relación de herencia cíclica, el motor te avisará.
- Si una multiplicidad es inválida, recibirás un diagnóstico.
- Si una composición tiene una multiplicidad incorrecta, el analizador lo detectará.

## ¿Cómo funciona?

El ecosistema se divide en piezas modulares:

1. **Escribes** el DSL en archivos `.umlts`.
2. **Engine** procesa el texto, valida la semántica y genera un modelo de datos (IR).
3. **Renderer** toma ese modelo y calcula un layout automático para generar un **SVG** impecable.
4. **Herramientas** como la extensión de VS Code o Blueprint cierran el ciclo de vida del desarrollo.
