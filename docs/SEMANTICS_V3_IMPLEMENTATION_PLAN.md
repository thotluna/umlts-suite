# Plan de Implementación: Refactorificación Semántica V3

Este plan detalla los pasos para desacoplar completamente la fase semántica del Parser, eliminando el uso de `ParserContext` y sustituyéndolo por una interfaz dedicada `ISemanticContext`. **El objetivo final es que ningún archivo en `src/semantics` tenga importaciones hacia `src/parser`.**

## Fase 0: Migración de Infraestructura (Compartido)

Para que el Parser y la Semántica sean independientes, debemos mover herramientas comunes a un lugar neutral.

1.  **Crear Directorio `src/core`**: Este será el hogar de servicios compartidos por todas las fases.
2.  **Mover `DiagnosticReporter`**:
    - Mover de `src/parser/diagnostic-reporter.ts` a `src/core/diagnostics/diagnostic-reporter.ts`.
    - Actualizar los imports en el Lexer y el Parser para apuntar a la nueva ubicación neutral.
3.  **Resultado**: `DiagnosticReporter` ahora es un servicio agnóstico que puede usar cualquier fase sin arrastrar lógica de parseo.

## Fase 1: Base y Abstracciones Semánticas

4.  **Crear Interfaz `ISemanticContext`** (`semantics/core/semantic-context.interface.ts`):
    - **NO** tendrá relación con `ParserContext`.
    - Definir métodos de diagnóstico: `addError`, `addWarning`, `addInfo`, `hasErrors`.
    - Definir servicios de registro (Registries): Para acceso a plugins de forma desacoplada.

5.  **Implementar `SemanticContext`** (`semantics/core/semantic-context.ts`):
    - Implementación concreta que use el `DiagnosticReporter` (ahora en `src/core`).
    - Gestionará los proveedores de plugins necesarios para la fase analítica.

## Fase 2: Refactorización del Núcleo Semántico

6.  **Desacoplar `AnalysisSession`**:
    - Cambiar la propiedad `context: ParserContext` por `context: ISemanticContext`.
    - Eliminar el import de `ParserContext`.

7.  **Refactorizar `SemanticAnalyzer`**:
    - Cambiar la firma de `analyze()` para recibir el nuevo contexto.
    - Asegurar que el orquestador no necesite nada del paquete parser.

## Fase 3: Migración de Componentes Especializados

8.  **Actualizar Analizadores (`Entity`, `Relationship`, `Constraint`)**:
    - Sustituir la dependencia del constructor de `ParserContext` por `ISemanticContext`.
    - Asegurar reporte de errores con tokens precisos.

9.  **Actualizar Validadores (`Hierarchy`, `Association`, `Multiplicity`)**:
    - Migrar a la nueva interfaz.
    - Garantizar que no existan fugas de tipos del parser.

## Fase 4: Integración en el Pipeline (Compiler Phase)

10. **Refactorizar `SemanticPhase`** (`compiler/phases/semantic.phases.ts`):
    - Esta clase es la única que "conoce" las piezas para armarlas.
    - **ELIMINAR** la creación de `ParserContext` para la semántica.
    - Instanciar `SemanticContext` directamente con el `DiagnosticReporter`.
    - Llamar al analizador con el nuevo contexto.

## Fase 5: Limpieza Estricta y Verificación

11. **Purgar Importaciones de Parser**:
    - Revisar cada archivo en `src/semantics`. **Prohibido importar nada de `@engine/parser/*`**.
    - Cualquier servicio compartido debe vivir ahora en `@engine/core/*` o `@engine/syntax/*`.

12. **Validación de Calidad**:
    - Ejecutar `pnpm test` en el paquete engine.
    - Verificar que no existan errores de `any` ni dependencias circulares.
    - Asegurar que la compilación es 100% limpia.
