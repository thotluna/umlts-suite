# Estrategia de Git y Flujo de Trabajo

Para mantener un historial limpio, organizado y profesional (aunque sea un proyecto académico), seguiremos las siguientes reglas para el manejo de Git.

## 1. Flujo de Trabajo: Feature Branch Workflow

No trabajaremos directamente en la rama `main` para funcionalidades nuevas.

*   **`main`**: Rama estable. Siempre debe compilar y pasar los tests.
*   **Funcionalidades**: Cada tarea del `task.md` tendrá su propia rama.
    *   Formato: `feat/nombre-tarea` o `fix/nombre-error`.
*   **Proceso**: Una vez terminada y testeada la tarea en su rama, se hará un `merge` (o `rebase`) hacia `main`.

## 2. Convención de Commits (Conventional Commits)

Utilizaremos el estándar de [Conventional Commits](https://www.conventionalcommits.org/) para que el historial hable por sí solo.

**Formato**: `<tipo>: <descripción en inglés>`

**Tipos permitidos**:
*   `feat`: Nueva funcionalidad (ej. `feat: implement lexer basic tokens`).
*   `fix`: Corrección de un error.
*   `docs`: Cambios solo en documentación.
*   `style`: Cambios que no afectan el significado del código (espacios, formateo).
*   `refactor`: Cambio de código que ni corrige un error ni añade funcionalidad.
*   `test`: Añadir o corregir tests.
*   `chore`: Tareas de mantenimiento (actualizar dependencias, configurar builds).

## 3. Reglas de Oro
1.  **Commits Atómicos**: Un commit debe hacer una sola cosa.
2.  **Mensajes en Inglés**: Siguiendo las reglas globales del proyecto, los mensajes de commit serán en inglés.
3.  **Tests antes de Push**: Nunca se sube código que rompa los tests existentes.
