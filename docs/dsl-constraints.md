# Especificación de Restricciones en UMLTS

Este documento detalla las decisiones de diseño y la visión técnica para el sistema de restricciones (Constraints) en el lenguaje UMLTS.

## 1. Visión y Filosofía

UMLTS sigue un enfoque de **Reconocimiento Gradual**. El objetivo es permitir la flexibilidad del estándar UML sin sacrificar la potencia de un motor que puede reaccionar inteligentemente a reglas específicas.

- **Libertad Sintáctica**: El lenguaje permite capturar cualquier contenido dentro de llaves `{...}`.
- **Reacción Semántica**: El motor solo activa comportamientos especiales (layout, generación de código, validación) cuando identifica palabras clave predefinidas. Las etiquetas no reconocidas se tratan como metadatos pasivos o comentarios visuales.

## 2. Sintaxis Soportada

### A. Bloques de Restricción

Ideal para agrupar múltiples elementos bajo una misma regla lógica.

```umlts
xor {
  ClaseA -- ClaseC
  ClaseB -- ClaseC
}
```

### B. Restricciones In-line

Permite vincular relaciones declaradas de forma dispersa mediante un identificador de grupo.

```umlts
ClaseA -- ClaseC {xor: c1}
ClaseB -- ClaseC {xor: c1}
```

### C. Restricciones en Miembros

Para reglas aplicadas a atributos o métodos.

```umlts
- items: string[*] {ordered, unique}
```

## 3. Estrategia de Renderizado (Caso XOR)

Para garantizar que las restricciones sean visualmente claras en nuestro renderizador personalizado:

1.  **Fuerzas de Layout (ELK.js)**:
    - Se inyectan **Aristas Virtuales** (`virtual edges`) con un peso de atracción alto entre las clases involucradas.
    - Esto fuerza al motor de layout a posicionar las clases "hermanas" de la restricción en proximidad física.
2.  **Dibujo SVG**:
    - Se traza una línea punteada (dashed line) que conecta los puntos medios de las asociaciones restringidas.
    - Se renderiza la etiqueta de la restricción (ej: `{xor}`) centrada sobre dicha línea.

## 4. Clasificación de Restricciones

El motor clasificará internamente el contenido de las llaves en:

- **Metadatos Semánticos**: Palabras clave simples (ej: `unique`, `ordered`).
- **Invariantes / Expresiones**: Lógica condicional (ej: `edad > 18`).
- **Restricciones de Relación**: Reglas que vinculan múltiples asociaciones (ej: `xor`, `or`, `subset`).
