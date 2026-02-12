/**
 * Diccionario de documentación para los operadores y símbolos del lenguaje UMLTS.
 * Estos textos se mostrarán en los "Hovers" al pasar el ratón sobre los símbolos.
 */
export const OPERATOR_DOCS: Record<string, string> = {
  // Relaciones y Herencia
  '>>': '**Herencia / Extensión**: Indica que una clase hereda de otra o una interfaz extiende otra.',
  '>extends': '**Herencia / Extensión**: Palabra clave alternativa para indicar herencia.',
  '>I': '**Implementación**: Indica que una clase implementa los contratos de una interfaz.',
  '>implements': '**Implementación**: Palabra clave alternativa para indicar implementación.',

  // Composiciones y Agregaciones
  '>*': '**Composición**: Relación fuerte de pertenencia. El ciclo de vida de la parte depende del todo.',
  '>comp': '**Composición**: Palabra clave alternativa para composición.',
  '>+': '**Agregación**: Relación de pertenencia débil. Las partes pueden existir fuera del todo.',
  '>agreg': '**Agregación**: Palabra clave alternativa para agregación.',

  // Asociaciones y Dependencias
  '>-': '**Asociación**: Relación estructural básica entre dos clases.',
  '>asoc': '**Asociación**: Palabra clave alternativa para asociación.',
  '..>': '**Dependencia**: Relación de uso temporal o dependencia débil entre elementos.',

  // Visibilidad
  '+': '**Público**: El miembro es accesible desde cualquier punto del sistema.',
  '-': '**Privado**: El miembro solo es accesible dentro de la propia clase.',
  '#': '**Protegido**: El miembro es accesible en la clase y en sus descendientes.',
  '~': '**Interno**: El miembro es accesible solo dentro del mismo paquete.',

  // Modificadores
  'static': '**Estático**: El miembro pertenece a la clase en sí, no a sus instancias.',
  '$': '**Estático**: Atajo simbólico para marcar un miembro como estático.',
  'abstract': '**Abstracto**: El elemento es una definición que debe ser concretada en subclases.',
  '*': '**Abstracto**: Atajo simbólico para marcar un elemento como abstracto.',

  // Configuración de Diagrama
  'config': '**Bloque de Configuración**: Permite definir ajustes específicos del diagrama como el tema, la dirección del layout y el espaciado.',
  'direction': '**Dirección del Layout**: Controla hacia dónde fluye el diagrama. Valores: `UP`, `DOWN`, `LEFT`, `RIGHT`.',
  'spacing': '**Espaciado**: Define la distancia mínima entre nodos en el diagrama.',
  'theme': '**Tema**: Controla el estilo visual del diagrama (ej: `light`, `dark`).',
  'showVisibility': '**Mostrar Visibilidad**: Si es `false`, oculta los símbolos `+`, `-`, `#` de los miembros.',
  'nodePadding': '**Padding de Nodo**: Espacio interno dentro de los contenedores (paquetes).',
};
