# Esquema del AST JSON (ts-uml-engine)

El AST (Abstract Syntax Tree) es el contrato entre el compilador y cualquier motor de renderizado. Debe ser un objeto JSON puro, serializable y sin referencias circulares en su estructura de memoria.

> [!NOTE]
> **Referencias vs. Dependencias**: El AST no permite *referencias circulares de objetos* (nodos apuntando físicamente a otros nodos en memoria). Sin embargo, soporta perfectamente *dependencias circulares de dominio* (Clase A → Clase B → Clase A) porque las relaciones se almacenan como **strings** (nombres de las clases), no como punteros a objetos.

## Estructura Raíz

```json
{
  "type": "Program",
  "body": [
    // Array de Statements (Package, Class, Interface, Enum, Relationship)
  ],
  "source": {
    "file": "string",
    "totalLines": "number"
  }
}
```

## Nodos Principales

### 1. Entidad (Class, Interface, Enum)
```json
{
  "type": "Entity",
  "kind": "class" | "interface" | "enum",
  "name": "string",
  "visibility": "string",
  "isAbstract": "boolean",
  "relationships": [
    // Relaciones declaradas en la cabecera (>> o >I)
    {
      "type": "inheritance" | "implementation",
      "target": "string"
    }
  ],
  "members": [
    {
      "type": "Attribute",
      "name": "string",
      "visibility": "string",
      "dataType": "string",
      "multiplicity": "string",
      "isRelation": "boolean",
      "isStatic": "boolean"
    },
    {
      "type": "Method",
      "name": "string",
      "visibility": "string",
      "isStatic": "boolean",
      "isAbstract": "boolean",
      "parameters": [
        { "name": "string", "type": "string" }
      ],
      "returnType": "string" // null si no se especifica
    }
  ],
  "location": { "start": { "line": 1, "col": 1 }, "end": { "line": 10, "col": 5 } }
}
```

### 2. Paquete (Package)
```json
{
  "type": "Package",
  "name": "string",
  "body": [
    // Statements anidados
  ]
}
```

### 3. Relación Externa (Relationship)
Se usa cuando la relación se define fuera del bloque de la entidad.
```json
{
  "type": "ExternalRelationship",
  "from": "string", // Nombre de la entidad origen
  "to": "string",   // Nombre de la entidad destino
  "kind": "inheritance" | "implementation" | "composition" | "aggregation" | "dependency",
  "multiplicity": {
    "from": "string",
    "to": "string"
  }
}
```

## Consideraciones de Diseño
1.  **Normalización de Nombres**: El Parser debe resolver los nombres de los paquetes. Si una clase `User` está en `package Auth`, en el AST el nombre debe ser `Auth.User`.
2.  **Visibilidad por Defecto**: Si no se especifica, se guarda físicamente como `public` en el AST para simplificar el trabajo del renderizador.
3.  **Multiplicidad**: El atajo `[]` debe venir ya normalizado como `0..*`.
