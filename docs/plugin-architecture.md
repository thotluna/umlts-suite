# Diseño de la Arquitectura de Plugins

## 1. Puntos de Integración del Plugin en el Ciclo de Vida del Motor

Para mantener un motor central puro y agnóstico, los plugins de lenguajes externos deben interactuar con el motor en puntos específicos de inyección:

- **Análisis Léxico (Matchers):** Inyectar instancias personalizadas de `TokenMatcher` para reconocer símbolos específicos del lenguaje (ej. `@` para decoradores en Java, `async`/`await` en JavaScript).
- **Parcheo (Rules):** Añadir o sobrescribir `ParserRules` (ej. `ITypeModifierProvider`) para interpretar estructuras sintácticas (ej. Tipos Tupla `[A, B]` en TypeScript).
- **Inicialización Semántica:** Proveer a la Tabla de Símbolos los tipos primitivos nativos (ej. `int`, `float`) y librerías estándar como genéricos (`Promise`, `List`) antes del análisis.
- **Resolución Semántica:** Transformar resoluciones nativas, delegando al plugin entender un tipo local (`Omit<T, K>`) para volver a crear una relación tipo UML pura.
- **Generación / Blueprint:** Encargarse de procesar la Representación Intermedia (IR) purificada para un output final de código sintácticamente correcto al marco objetivo.

## 2. Los Problemas de Conservar una Arquitectura de Plugin Monolítica

Integrar la totalidad de lógicas estáticamente bajo el repositorio `engine` provoca una falta grave de escala:

- **Pesos de Dependencia y Bundles:** El usuario consume MB de múltiples idiomas o configuraciones cuando solo le interesaría una de ellas.
- **Acoplar Modificadores Prolijamente (Principios Open/Closed):** Para agregar el 11ᵗᵒ idioma se forzaría al publicador oficial a subir arreglos y builds completos por cada bug del lenguaje individual.
- **Degradación de Performance:** Activar la provisión (matchers y vocabularios) de múltiples plataformas aunque su contexto sea nulo retrasa la inicialización para editores e instancias temporales.
- **Comunidad Externalizada (Barreras Absolutas):** Se impide formalmente construir y distribuir extensiones libremente desde perfiles independientes o la NPM.

## 3. Empaquetados Externos (Paquetes) e Inversión de Control (IoC)

El formato final es descentralizando la extensión del engine, entregándolas a manera de paquetes autónomos de ecosistema NPM (`@umlts/plugin-java`, `@umlts/plugin-sql`).

- La meta subyacente de `@umlts/engine` pasa a únicamente brindar Contratos de interfaces abstractas precisas (Hooks y Firmas como `IUMLPlugin`, `ITokenMatcherFactory`).
- El consumidor efectúa directamente las inclusiones exclusivas: `npm install @umlts/plugin-sql`.
- Los plugins tienen la **Inversión de Control**: Se cargan dinámicamente y registran sus propias características con el API pública del engine.

## 4. Ampliando el Horizonte (Extensiones No Sólo Para Idiomas)

Dado que el motor está totalmente desacoplado mediante interfaces, los plugins no se limitan a la sintaxis del lenguaje. Los tipos de plugins posibles incluyen:

- **Frameworks de Negocio:** Plugins React para inyectar `State<T>`, Prisma/Mongoose para incluir y validar los tipos NoSQL.
- **Exporters (Generadores Nativos):** Traducir el IR de UML a SQL DDL, GraphQL, OpenAPI, o Protobuf.
- **Linters Abstractos (Limitantes o Validators):** Crear reglas semánticas personalizadas (ej. forzar las restricciones de Arquitectura Hexagonal).
- **Generación Visual:** Exportando hacia alternativas como Mermaid.js, PlantUML, o sintaxis D2 en lugar del viejo SVG.

## 5. Estrategia Principal: Registro Programático (Librería Pura)

Es vital comprender que `@umlts/engine` es estrictamente una **librería base (paquete)**, no una aplicación autónoma ni un framework. Por lo tanto, el motor **nunca debe leer archivos del disco** (como un `umlts.config.json`) ni implementar un CLI. Esa es responsabilidad de la aplicación "Host" que consume el motor (ej. la extensión de VS Code, un plugin de Markdown, o un editor web).

La activación de plugins se realiza de forma **programática** y opcional mediante Inyección de Dependencias en el constructor:

1. **El Host resuelve los plugins:** La aplicación consumidora decide qué plugins usar basándose en su propio entorno (leyendo preferencias de VS Code, un archivo config del proyecto, etc.).
2. **Inyección en el Motor:** El Host le pasa al motor las instancias de los plugins al crearlo.
3. **Comportamiento por defecto (UML Puro):** Si no se le inyectan plugins, el motor simplemente funciona analizando UML estándar sin características adicionales, permitiendo que existan usuarios que solo usen UML nativo.

```typescript
// Código en la App Host (ej. Extensión de VS Code), NO en el engine
import { UMLEngine } from '@umlts/engine'
import typescriptPlugin from '@umlts/plugin-typescript'

// La app host provee el array de plugins opcionalmente
const engine = new UMLEngine({
  plugins: [typescriptPlugin()],
})

// El motor registrará los plugins provistos antes de procesar el texto
const result = engine.parse(sourceText)
```

Este diseño garantiza que el motor funcione en cualquier entorno (Node.js, Navegador, etc.) manteniendo su núcleo purificado y agnóstico.
