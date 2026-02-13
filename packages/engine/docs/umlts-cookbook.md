# 📖 UMLTS Cookbook: Patrones de Modelado

Este documento recopila las formas recomendadas de modelar escenarios complejos en el lenguaje UMLTS.

## 1. Clases y Miembros (Estándar Base)

Priorizar brevedad y uso de símbolos de visibilidad. El tipo de retorno es opcional si es simple.

**Escenario**: Una clase `Vehiculo` con ID privado y método público.

```umlts
class Vehiculo {
    - id: UUID
    + arrancar()
}
```

## 2. Implementación Múltiple (Interfaces)

Se permite el uso de múltiples interfaces encadenando el operador `>I`. La herencia múltiple de clases **no** está permitida.

**Escenario**: Una `Moto` que hereda de `Vehiculo` e implementa `IVolador` y `ICombustible`.

```umlts
class Moto >> Vehiculo >I IVolador >I ICombustible {
    - motor: >* MotorX
}
```

## 3. Abstracción y Agregación

Soporte para clases abstractas como destino de relación y métodos abstractos simbólicos.

**Escenario**: Un `Padre` que hereda de un `Abuelo` abstracto y tiene una agregación de `Hobby`.

```umlts
class Padre >> *Abuelo {
    - hobby: >+ Hobby[0..*]
    *getHobbies()
}
```

## 4. Dependencia de Uso

Se utiliza el símbolo `>-` para indicar que una entidad depende de otra, frecuentemente declarado en los parámetros de un método.

**Escenario**: Un `Monitor` que usa un `Dato` en su método de procesamiento.

```umlts
class Monitor {
    + procesar(d: >- Dato)
}
```

## 5. Nombres Cualificados (FQN) y Colecciones

Las relaciones pueden apuntar a entidades en otros paquetes usando el punto (`.`). El atajo `[]` es preferido para colecciones.

**Escenario**: Un `Monitor` que implementa una interfaz en otro paquete y posee una colección de `Dato`.

```umlts
class Monitor >I sistema.IControl {
    + datos: >* Dato[]
}
```

## 5. Ejemplo Maestro: Sistema de Automóvil

Un ejemplo que combina todas las reglas: herencia simple, implementación múltiple, composición, agregación, dependencias de uso, genéricos y namespaces.

```umlts
*class Vehiculo<T> {
    - motor: >* T
    + getMotor(): T
}

interface IEncendible {
    + encender()
}

interface IControlable {
    + girar(direccion: string)
}

package Suministros {
    class Gasolina {
        - octanaje: int
    }
}

class MotorX {
    - caballos: int
}

class Rueda {
    - presion: float
}

class Automovil >> Vehiculo<MotorX> >I IEncendible >I IControlable {
    - motor: >* MotorX
    - ruedas: >+ Rueda[4]

    + encender()
    + girar(d: string)
    + repostar(c: >- Suministros.Gasolina)
}
```
