---
title: Especificación UML 2.5.1
description: Detalle del cumplimiento de las reglas semánticas de UML 2.5.1 en el motor UMLTS.
---

Este documento detalla el estado de implementación de las reglas semánticas de la especificación UML 2.5.1 en el motor UMLTS.

## 1. Reglas de Multiplicidad y Valores

| Regla                                                    | Estado | Notas                               |
| :------------------------------------------------------- | :----: | :---------------------------------- |
| El límite superior debe ser mayor o igual al inferior    |   ✅   | Validado en `MultiplicityValidator` |
| El límite inferior debe ser un número entero no negativo |   ✅   | Validado en `MultiplicityValidator` |
| El límite superior debe ser un número natural ilimitado  |   ✅   | Validado en `MultiplicityValidator` |
| Multiplicidad `0..0` implica ausencia de instancias      |   ✅   | Soportado semánticamente            |

## 2. Reglas de Generalización y Herencia

| Regla                                               | Estado | Notas                                 |
| :-------------------------------------------------- | :----: | :------------------------------------ |
| Jerarquías de generalización acíclicas              |   ✅   | Validado en `HierarchyValidator`      |
| No especializar clasificadores marcados como "hoja" |   ❌   | Pendiente: Añadir modificador `leaf`  |
| Padres no pueden ser "finales"                      |   ❌   | Pendiente: Añadir modificador `final` |

## 3. Reglas de Asociaciones y Agregación

| Regla                                              | Estado | Notas                                  |
| :------------------------------------------------- | :----: | :------------------------------------- |
| Solo asociaciones binarias pueden tener agregación |   ✅   | Restringido por la sintaxis            |
| Composición: Multiplicidad máxima de 1             |   ✅   | Validado en `RelationshipAnalyzer`     |
| Dueño de extremo navegable es el tipo opuesto      |   ✅   | Soportado mediante declaración in-line |

---

**Leyenda:**

- ✅ : Implementado y Validado.
- ❌ : Pendiente de implementación.
- 🟢 : No aplica o cubierto por diseño.
- 🟡 : Parcialmente implementado.
