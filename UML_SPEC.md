# Especificación de Cumplimiento UML 2.5.1

Este documento detalla el estado de implementación de las reglas semánticas de la especificación UML 2.5.1 en el motor UMLTS.

## 1. Reglas de Multiplicidad y Valores

| Regla                                                               | Estado | Notas                                |
| :------------------------------------------------------------------ | :----: | :----------------------------------- |
| El límite superior debe ser mayor o igual al inferior.              |   ✅   | Validado en `MultiplicityValidator`. |
| El límite inferior debe ser un número entero no negativo.           |   ✅   | Validado en `MultiplicityValidator`. |
| El límite superior debe ser un número natural ilimitado (\* o > 0). |   ✅   | Validado en `MultiplicityValidator`. |
| Especificaciones de valor sin efectos secundarios.                  |   🟢   | N/A: El DSL es estático/declarativo. |
| Multiplicidad `0..0` implica ausencia de instancias.                |   ✅   | Soportado semánticamente.            |

## 2. Reglas de Generalización y Herencia

| Regla                                                            | Estado | Notas                                         |
| :--------------------------------------------------------------- | :----: | :-------------------------------------------- |
| Jerarquías de generalización acíclicas.                          |   ✅   | Validado en `HierarchyValidator`.             |
| No especializar clasificadores marcados como "hoja" (IsLeaf).    |   ❌   | Pendiente: Añadir modificador `leaf` al DSL.  |
| Padres no pueden ser "finales" (IsFinalSpecialization).          |   ❌   | Pendiente: Añadir modificador `final` al DSL. |
| El elemento raíz (IsRoot) no puede tener padres.                 |   ❌   | Pendiente: Añadir modificador `root` al DSL.  |
| Conjunto "disjunto": No permite múltiples subtipos a la vez.     |   ❌   | Pendiente: Soporte para Generalization Sets.  |
| Conjunto "completo": Instancia del padre debe ser de algún hijo. |   ❌   | Pendiente: Soporte para Generalization Sets.  |
| El powertype no puede ser padre ni hijo en el mismo conjunto.    |   ❌   | Pendiente: Soporte para powertypes.           |

## 3. Reglas de Asociaciones y Agregación

| Regla                                                           | Estado | Notas                                             |
| :-------------------------------------------------------------- | :----: | :------------------------------------------------ |
| Solo asociaciones binarias pueden tener agregación/composición. |   ✅   | Restringido por la sintaxis del DSL.              |
| Asociaciones N-arias: Extremos propiedad de la asociación.      |   ❌   | Pendiente: Definir sintaxis para N-arias.         |
| Composición (diamante negro): Multiplicidad máxima de 1.        |   ✅   | Validado en `RelationshipAnalyzer`.               |
| Dueño de extremo navegable es el tipo del extremo opuesto.      |   ✅   | Soportado mediante declaración in-line.           |
| Properties calificadas (qualifiers) deben ser extremos.         |   ❌   | Pendiente: Soporte para Qualifiers.               |
| Asociación especializada debe tener mismo número de extremos.   |   ❌   | Pendiente: Validación de redefinición de aristas. |

## 4. Clases de Asociación (Association Classes)

| Regla                                                     | Estado | Notas                                            |
| :-------------------------------------------------------- | :----: | :----------------------------------------------- |
| No puede definirse entre ella misma y otro elemento.      |   ❌   | Pendiente: Implementación de Assoc Class.        |
| Nombres de atributos y extremos deben ser disjuntos.      |   ❌   | Pendiente: Validación de nombres en Assoc Class. |
| No puede ser generalización de asociación o clase simple. |   ❌   | Pendiente: Restricción de jerarquía.             |

## 5. Propiedades, Atributos y Redefinición

| Regla                                                              | Estado | Notas                                  |
| :----------------------------------------------------------------- | :----: | :------------------------------------- |
| Una propiedad no puede subconjuntar a otra con mismo nombre.       |   ❌   | Pendiente: Soporte para `subsets`.     |
| Propiedad que redefine debe ser consistente en tipo/multiplicidad. |   ❌   | Pendiente: Soporte para `redefines`.   |
| La propiedad redefinida debe haber sido heredada.                  |   ❌   | Pendiente: Validación de redefinición. |
| Unión derivada (derived union) obligatoriamente read-only.         |   ❌   | Pendiente: Soporte para `/` (derived). |
| Propiedades estáticas caracterizan al clasificador.                |   ✅   | Soportado mediante `static` / `$`.     |

## 6. Espacios de Nombres y Paquetes

| Regla                                                      | Estado | Notas                                   |
| :--------------------------------------------------------- | :----: | :-------------------------------------- |
| Miembros deben tener nombres distinguibles (únicos).       |   ✅   | Validado en `EntityAnalyzer`.           |
| Un paquete no puede importarse a sí mismo.                 |   🟢   | N/A: No existe el comando `import` aún. |
| No importar un elemento que ya es miembro propio.          |   🟢   | N/A: Basado en resolución FQN.          |
| Visibilidad requiere que el elemento tenga un propietario. |   ✅   | Soportado en el modelo IR.              |

## 7. Componentes y Puertos

| Regla                                                     | Estado | Notas                                  |
| :-------------------------------------------------------- | :----: | :------------------------------------- |
| Un componente no puede anidar otros clasificadores.       |   ❌   | Pendiente: Regla en `EntityAnalyzer`.  |
| Agregación de un puerto debe ser siempre compuesta.       |   ❌   | Pendiente: Validación de puertos.      |
| Componente anidado no puede tener elementos empaquetados. |   ❌   | Pendiente: Restricción de anidamiento. |

---

**Leyenda:**

- ✅ : Implementado y Validado.
- ❌ : Pendiente de implementación.
- 🟢 : No aplica o cubierto por diseño.
- 🟡 : Parcialmente implementado.
