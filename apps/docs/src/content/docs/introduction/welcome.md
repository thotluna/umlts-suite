---
title: Bienvenido a UMLTS
description: La suite definitiva para modelado UML textual con poder de TypeScript.
---

**UMLTS** (Unified Modeling Language - TypeScript Syntax) es una suite de herramientas diseñada para desarrolladores que prefieren el código sobre los diagramas de arrastrar y soltar.

## ¿Qué es UMLTS?

Es un ecosistema que incluye:

- **Motor (Engine)**: Un parser y analizador semántico robusto que cumple con UML 2.5.1.
- **Renderizador (Renderer)**: Un motor de dibujo basado en SVG y ELK.js para layouts automáticos impecables.
- **Extensión de VS Code**: Previsualización en tiempo real y asistencia de lenguaje.
- **Blueprint Extractor**: Ingeniería inversa para generar diagramas desde código TypeScript real.

## ¿Por qué usarlo?

1.  **Versionable**: Al ser texto plano, puedes usar Git para ver quién cambió qué parte del diseño.
2.  **Productivo**: Escribe diagramas a la velocidad de tu pensamiento sin pelear con el mouse.
3.  **Semántico**: No es solo "dibujar cajas"; el motor entiende las reglas de UML y te avisará si cometes errores de diseño.

## Instalación Rápida

```bash
# Instalar el CLI globalmente
npm install -g @umlts/cli

# Generar un diagrama desde un archivo .umlts
umlts build mi-clase.umlts --output diagrama.svg
```
