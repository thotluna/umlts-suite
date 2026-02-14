# 🧠 Heurísticas de Clasificación de Relaciones (UMLTS Blueprint)

Este documento define la filosofía y las reglas lógicas utilizadas por el extractor de `@umlts/blueprint` para convertir código TypeScript en diagramas UMLTS. Se basa en tres variables fundamentales: **Visibilidad, Versatilidad y Momentaneidad**.

## 1. El Triángulo de Decisión

| Variable          | Descripción                                                         | Impacto en UMLTS             |
| :---------------- | :------------------------------------------------------------------ | :--------------------------- |
| **Momentaneidad** | Determina si la relación es estructural o transitoria.              | Atributo vs. Método          |
| **Visibilidad**   | Determina el nivel de encapsulación y secreto.                      | Privado (-) vs. Público (+)  |
| **Versatilidad**  | Determina si una entidad tiene identidad propia o es parte de otra. | Conteo Global de Referencias |

---

## 2. Definiciones de Relación

### A. Composición (`>*`) - "Dueñidad Exclusiva"

Representa una relación **Todo-Parte** donde el Todo es dueño absoluto del ciclo de vida de la Parte.

- **Sintaxis**: Dentro del cuerpo de la entidad `{ ... }`.
- **Heurística de Código**:
  - Debe ser un **Atributo** (Larga Vida).
  - Debe ser `private` o `protected` (Exclusividad).
  - **Efecto Cirujano**: Si existe un Getter público que exponga la referencia mutable, no puede ser composición (se degrada a Agregación).
  - **Instanciación**: Suele instanciarse con `new` dentro de la clase, aunque la inyección de dependencias (DI) puede ocultar esto.

### B. Agregación (`>+`) - "Vínculo Compartido"

Representa una relación donde la Parte es un componente del Todo, pero tiene vida independiente y puede ser compartida.

- **Sintaxis**: Dentro del cuerpo de la entidad `{ ... }`.
- **Heurística de Código**:
  - Debe ser un **Atributo** (Larga Vida).
  - Es `public` o tiene Getters públicos (Alta Visibilidad).
  - Viene del exterior (parámetros del Constructor o Singletons).
  - Alta **Versatilidad**: La entidad destino es referenciada por múltiples entidades en el proyecto.

### C. Uso / Dependencia (`>-`) - "Momento Efímero"

Representa una necesidad transitoria para realizar una tarea específica.

- **Sintaxis**: Siempre **FUERA** del cuerpo de la entidad (Relación externa).
- **Heurística de Código**:
  - **NO es un atributo**.
  - Aparece solo en: parámetros de métodos, tipos de retorno o variables locales.
  - Muere cuando el método termina su ejecución.

---

## 3. Algoritmo de Ingeniería Inversa (Doble Pasada)

Para minimizar la ambigüedad, el extractor debe operar en dos fases:

### Fase 1: Análisis de Versatilidad (Global)

Se escanea todo el proyecto para generar un **Mapa de Referencias**.

- Contar cuántas veces es importada/mencionada cada Clase/Interface.
- Si `count(Entidad) > 2`, se marca como de "Alta Versatilidad".

### Fase 2: Extracción Semántica (Local)

Al analizar una clase `A` que referencia a `B`:

1.  **¿Es `B` un atributo de `A`?**
    - **NO** $\rightarrow$ Clasificar como **Uso (`>-`)**.
    - **SÍ** $\rightarrow$ Ir al paso 2.
2.  **¿Es `B` privado y no tiene getters públicos?**
    - **SÍ** $\rightarrow$ Evaluar Versatilidad:
      - Si Versatilidad es Baja (solo `A` usa a `B`) $\rightarrow$ **Composición (`>*`)**.
      - Si Versatilidad es Alta (otros usan a `B`) $\rightarrow$ **Agregación (`>+`)**.
    - **NO** $\rightarrow$ Clasificar como **Agregación (`>+`)**.

---

## 4. Casos Especiales

- **Interfaces**:
  - Si solo tienen propiedades (Data Structure) -> Se tratan como Clases (pueden ser Parte/Composición).
  - Si tienen métodos (Contratos) -> Se tratan como Servicios (siempre Agregación o Uso).
- **Dependencias Cíclicas**: No se intentará resolver la semántica de ciclos. Se reportarán tal cual aparecen, ya que el ciclo es responsabilidad del diseñador.
- **Singletons/Static**: Al ser de acceso global, su versatilidad es inherentemente alta, por lo que suelen clasificarse como **Uso** o **Agregación**.

---

_Nota: Esta herramienta es una aproximación. El diseño de software es un acto de intención humana que el código no siempre captura al 100%._
