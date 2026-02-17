# Requisitos de Clase UML

- Nombre
- Tipo (Clase, Interfaz, Enum)
- Parámetros de tipo (Generics)
- Atributos
- Métodos
- Visibilidad
- Modificador Abstracto
- Modificador Estático
- Modificador Activo
- Modificador Final/Leaf
- Namespace / Paquete
- Documentación / Comentarios

## Lo que espera la Librería (Entrada para ELK)

- ID Único (String)
- Ancho / Width (Number) -> **Calculado por nosotros** basándonos en el texto más largo.
- Alto / Height (Number) -> **Calculado por nosotros** basándonos en el número de líneas (cabecera, atributos, métodos).
- Opciones de Layout (Object/Map)
- Puertos (Opcional, si se quieren puntos de anclaje fijos)
- Propiedades de Jerarquía (si es parte de un paquete)

## Reglas de Jerarquía y Dependencias (Layout)

1. **Herencia e Implementación**:
   - Las **clases padres/interfaces** deben posicionarse en niveles **superiores**.
   - Las **clases hijas/implementaciones** deben posicionarse en niveles **inferiores**.
   - La flecha (triángulo) apunta hacia arriba.

2. **Composición y Agregación**:
   - Las clases con **más dependencias** (las que contienen o agrupan a otras) deben estar en niveles **superiores**.
   - Las clases con **menos dependencias** (clases base o componentes individuales) deben estar en niveles **inferiores**.
   - Esto asegura que el "orquestador" o "contenedor" se visualice arriba de sus componentes.

## Pre-procesamiento de Niveles (Layering Strategy)

Para garantizar un diagrama ordenado, se debe implementar una fase de cálculo de niveles antes del Layout:

1. **Cálculo de Rango (Rank)**:
   - Se debe analizar el grafo de relaciones para asignar un nivel vertical a cada nodo.
   - **Nivel Máximo (Top)**: Clases con alta densidad de dependencias salientes (Composición/Agregación) o Raíces de herencia.
   - **Nivel Mínimo (Bottom)**: Clases con cero dependencias salientes ("Hojas" semánticas).

2. **Inversión de Flujo Semántico**:
   - Aunque la flecha UML de herencia apunte al padre, el motor de layout debe tratar el vínculo como `Padre -> Hijo` para que la gravedad del diagrama mantenga la jerarquía natural (lo más abstracto arriba).

3. **Pesos por Tipo de Relación**:
   - `Herencia > Composición > Agregación > Asociación > Dependencia`.
   - Este orden de prioridad asegura que la estructura principal (herencia) sea la que más influya en la posición de los nodos.
