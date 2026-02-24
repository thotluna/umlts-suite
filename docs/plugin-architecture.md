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

## 6. Gestión de Memoria: Instanciación Bajo Demanda (Lazy Loading)

Para evitar que el motor se vuelva pesado o sufra de _Memory Leaks_ al cargar múltiples plugins, la arquitectura implementará una carga perezosa:

- **Registro de Definiciones, no Instancias:** Durante el arranque del motor, los plugins solo registran sus interfaces y firmas (metadatos ligeros).
- **Instanciación On-Demand:** Los objetos "pesados" del plugin (como Orquestadores de Matchers o Resolutores Semánticos complejos) solo se instancian en el momento preciso en que el motor requiere su intervención durante el análisis.
- **Ciclo de Vida Efímero:** Una vez finalizado el proceso de análisis (`parse`), las instancias pesadas creadas bajo demanda pueden ser liberadas, manteniendo el consumo de RAM al mínimo y evitando arrastrar objetos innecesarios a través del pipeline.

Esto permite que un sistema con decenas de plugins instalados mantenga el mismo rendimiento y ligereza que uno que no tiene ninguno, activando solo el código estrictamente necesario para el archivo que se está procesando.

## 7. Contrato de Interfaces y Descubrimiento de Capacidades

Para garantizar que el motor sea extensible y que los plugins antiguos sigan funcionando incluso si el motor evoluciona (compatibilidad hacia atrás), se utilizará un sistema de **Capacidades Opcionales**.

### 1. Interfaz Genérica (`IUMLPlugin`)

Es el contrato base que todos los plugins deben implementar. No contiene lógica pesada, solo identidad y el método de descubrimiento.

```typescript
export interface IUMLPlugin {
  readonly name: string
  readonly version: string

  /**
   * Método de descubrimiento. El motor pregunta por una capacidad específica.
   * Si el plugin no la soporta (o es antiguo y no la conoce), devuelve undefined.
   */
  getCapability?<T>(name: string): T | undefined
}
```

### 2. Capacidad de Lenguaje (`ILanguageCapability`)

Un plugin que extiende la sintaxis o semántica de un lenguaje implementa esta capacidad.

```typescript
export interface ILanguageCapability {
  /**
   * El motor llama a este método pasando la API necesaria para configurar el pipeline.
   */
  setup(api: ILanguageAPI): void
}
```

### 3. API de Lenguaje (`ILanguageAPI`)

Es el conjunto de herramientas que el motor pone a disposición del plugin durante la fase de `setup`.

```typescript
export interface ILanguageAPI {
  // --- Nivel Léxico ---
  addTokenMatcher(matcher: TokenMatcher): void

  // --- Nivel Sintáctico (Parser) ---
  addTypePrimary(provider: IPrimaryTypeProvider): void
  addTypeModifier(modifier: ITypeModifierProvider): void
  addMemberProvider(provider: IMemberProvider): void
  addStatementRule(rule: StatementRule): void

  // --- Nivel Semántico ---
  registerPrimitiveTypes(types: string[]): void
}
```

Este diseño de "Interfaces en 3 capas" asegura que:

1.  **IUMLPlugin:** Identifica al plugin.
2.  **Capability:** Define qué sabe hacer el plugin (desacoplado del motor).
3.  **API:** Define qué le permite hacer el motor al plugin (seguridad y control).

## 8. Orquestación Interna y Flujo de Datos (Fontanería)

Para evitar el _prop drilling_ (pasar objetos por múltiples capas) y mantener el sistema desacoplado, el motor utiliza un flujo de datos unidireccional y consumo bajo demanda:

### 1. Fase de Registro (Bootstrap)

Al instanciar `UMLEngine`, se crea un `PluginRegistry`. El motor recorre los plugins y les permite registrar sus capacidades. El `PluginRegistry` almacena únicamente las definiciones de capacidades inyectadas.

### 2. Inyección vía Factorías

El motor utiliza factorías especializadas (`LexerFactory`, `ParserFactory`) para crear las instancias de cada fase. El motor solo pasa el `PluginRegistry` a la **Factoría**, no a todos los componentes internos.

### 3. Distribución a Orquestadores

La Factoría es la encargada de "vitaminar" a los orquestadores de cada etapa:

- **Lexer:** La `LexerFactory` obtiene los matchers de lenguaje del registro y los inyecta directamente en el `MasterMatcher`.
- **Parser:** La `ParserFactory` obtiene las reglas y proveedores de tipos y los inyecta en el `IParserHub`.

### 4. Consumo en Reglas Atómicas

Las reglas individuales (como `TypeRule`) no conocen la existencia de los plugins. Ellas simplemente preguntan a su orquestador (`IParserHub`) por los proveedores disponibles. El orquestador devuelve la lista ya mezclada (Nativos + Plugins), permitiendo una ejecución transparente.

Este flujo garantiza que los plugins estén disponibles exactamente donde se necesitan, sin ensuciar la lógica de negocio del compilador con parámetros de configuración redundantes.
