# @umlts/blueprint

Herramienta de ingeniería inversa para generar diagramas UMLTS automáticamente a partir de código TypeScript.

## 🚀 Uso

Para generar un diagrama UMLTS a partir de tus archivos fuente, utiliza el comando:

```bash
npx umlts-blueprint <ruta-fuente> [opciones]
```

### Opciones Disponibles

- `<ruta-fuente>`: Patrón glob de los archivos fuente (ej. `"src/**/*.ts"`).
- `-o, --output <file>`: Especifica el archivo `.umlts` de salida.
- `--exclude <patterns...>`: Patrones para excluir archivos.

### Ejemplos

**Generar y guardar en un archivo:**

```bash
npx umlts-blueprint "src/**/*.ts" -o architecture.umlts
```

**Generar y mostrar por consola:**

```bash
npx umlts-blueprint "src/**/*.ts"
```

**Excluir archivos de prueba:**

```bash
npx umlts-blueprint "src/**/*.ts" --exclude "**/*.test.ts" -o model.umlts
```

---

## 🛠️ Desarrollo

Si estás trabajando en el monorepo, puedes ejecutarlo usando:

```bash
pnpm --filter @umlts/blueprint dev -- "src/**/*.ts"
```
