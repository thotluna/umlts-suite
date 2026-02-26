---
title: Instalación
description: Cómo instalar y configurar las herramientas de UMLTS.
---

Puedes empezar a usar UMLTS de varias formas dependiendo de tu flujo de trabajo.

## 1. CLI (Interfaz de Línea de Comandos)

Ideal para automatizar la generación de diagramas en CI/CD o desde tu terminal favorita.

```bash
# Instalación global
npm install -g @umlts/cli

# Verificar instalación
umlts --version
```

## 2. Extensión de VS Code

La forma recomendada para el desarrollo diario. Proporciona resaltado de sintaxis, autocompletado y previsualización en tiempo real.

1. Abre **Visual Studio Code**.
2. Ve a la pestaña de **Extensiones** (`Ctrl+Shift+X`).
3. Busca **"UMLTS Suite"**.
4. Haz clic en **Instalar**.

## 3. Uso en Proyectos TypeScript

Si quieres integrar el motor en tu propia infraestructura o usar el Blueprint Extractor:

```bash
pnpm add @umlts/engine @umlts/renderer
```
