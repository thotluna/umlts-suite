# Sintaxis de Mermaid para Diagramas de Clase

Este documento resume la sintaxis correcta para diagramas de clase en Mermaid, específicamente para interfaces y genéricos, según la documentación oficial.

## Interfaces Lollipop
Las interfaces pueden representarse de forma simplificada usando la notación "lollipop":
- `bar ()-- foo`: La interfaz `bar` se conecta a la clase `foo`.
- `foo --() bar`: La clase `foo` provee/usa la interfaz `bar`.

> [!NOTE]
> Cada interfaz definida de esta manera es única y no debe ser compartida entre múltiples clases con múltiples aristas.

## Tipos Genéricos (Templates)
Para denotar un elemento como genérico, se debe encerrar el tipo entre virgulillas `~` en lugar de brackets `< >`.

**Ejemplos:**
- Clase genérica: `class Animal~T~`
- Miembro genérico: `+List~string~ members`
- Tipos anidados: `List~List~int~~`

> [!WARNING]
> Actualmente, Mermaid tiene soporte limitado para genéricos con múltiples parámetros (separados por coma) como `Map~K, V~`. Se recomienda verificar la versión de Mermaid utilizada.

## Relaciones Estándar
- Herencia: `Base <|-- Derived`
- Implementación: `Interface <|.. Class` (o usar Lollipop si se prefiere la vista simplificada)
- Composición: `Owner *-- Member`
- Agregación: `Owner o-- Member`
- Asociación: `A --> B`

## Clasificadores de Miembros
- Abstracto: `metodo()*`
- Estático: `metodo()$`
- Miembro estático: `string campo$`

---
**Fuente:** [Mermaid Class Diagram Documentation](https://mermaid.ai/docs/mermaid-oss/syntax/classDiagram.html)
