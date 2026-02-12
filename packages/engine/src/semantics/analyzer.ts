import type {
  ProgramNode,
  PackageNode,
  EntityNode,
  RelationshipNode,
  CommentNode
} from '../parser/ast/nodes';
import { ASTNodeType } from '../parser/ast/nodes';
import type { ASTVisitor } from '../parser/ast/visitor';
import { walkAST } from '../parser/ast/visitor';
import type {
  IRDiagram,
  IREntity,
  IRRelationship,
  IRMember
} from '../generator/ir/models';
import {
  IREntityType,
  IRRelationshipType,
  IRVisibility
} from '../generator/ir/models';
import { SymbolTable } from './symbol-table';

/**
 * Analizador Semántico que transforma el AST en una IR resuelta.
 * Implementa la lógica de "Dos Pasadas".
 */
export class SemanticAnalyzer {
  private symbolTable = new SymbolTable();
  private relationships: IRRelationship[] = [];
  private currentNamespace: string[] = [];

  /**
   * Ejecuta el análisis semántico completo.
   */
  public analyze(program: ProgramNode): IRDiagram {
    // Paso 1: Recolectar todas las declaraciones explícitas
    const declVisitor = new DeclarationVisitor(this, this.symbolTable, this.currentNamespace);
    walkAST(program, declVisitor);

    // Paso 2: Procesar relaciones y crear entidades implícitas
    this.currentNamespace = []; // Reset namespace para la segunda pasada
    const relVisitor = new RelationshipVisitor(this, this.symbolTable, this.relationships, this.currentNamespace);
    walkAST(program, relVisitor);

    // Paso 3: Inferencia Automática (Basado en tipos de miembros)
    this.inferRelationships();

    // Paso 4: Limpiar miembros redundantes (UML Source of Truth)
    this.cleanupRedundantMembers();

    return {
      entities: this.symbolTable.getAllEntities(),
      relationships: this.relationships
    };
  }

  /**
   * Recorre todos los miembros de todas las entidades y crea relaciones implícitas
   * si el tipo de un miembro coincide con otra entidad conocida.
   */
  private inferRelationships(): void {
    const entities = this.symbolTable.getAllEntities();

    entities.forEach(entity => {
      entity.members.forEach(member => {
        // 1. Inferir del tipo del atributo o retorno del método
        if (member.type) {
          if (member.relationshipKind) {
            const relType = mapRelationshipType(member.relationshipKind);
            this.inferFromType(entity.id, member.type, entity.namespace, member.name, relType, member.multiplicity, member.visibility);
          }
        }

        // 2. Inferir de los parámetros del método
        if (member.parameters) {
          member.parameters.forEach(param => {
            if (param.relationshipKind) {
              const relType = mapRelationshipType(param.relationshipKind);
              this.inferFromType(entity.id, param.type, entity.namespace, param.name, relType, undefined, IRVisibility.PUBLIC);
            }
          });
        }
      });
    });
  }

  private inferFromType(
    fromFQN: string,
    typeName: string,
    fromNamespace?: string,
    label?: string,
    relType: IRRelationshipType = IRRelationshipType.ASSOCIATION,
    multiplicity?: string,
    visibility?: IRVisibility
  ): void {
    const primitives = [
      'string', 'number', 'boolean', 'void', 'any', 'unknown', 'never', 'object',
      'cadena', 'fecha', 'entero', 'booleano', 'int', 'float', 'double', 'char',
      'horadía', 'date', 'time', 'datetime'
    ];
    if (primitives.includes(typeName.toLowerCase())) return;

    const baseType = typeName.replace(/[\[\]]/g, '');
    const cleanBaseType = baseType.includes('<') ? baseType.substring(0, baseType.indexOf('<')) : baseType;
    const toFQN = this.resolveOrRegisterImplicit(cleanBaseType, fromNamespace || '');

    if (this.shouldCreateInferredRel(fromFQN, toFQN, relType, label)) {
      this.relationships.push({
        from: fromFQN,
        to: toFQN,
        type: relType,
        label: label || '',
        toMultiplicity: multiplicity,
        visibility: visibility || IRVisibility.PUBLIC
      });
    }
  }

  /**
   * Resuelve un nombre y si no existe en la tabla de símbolos, lo registra como implícito.
   */
  public resolveOrRegisterImplicit(name: string, namespace: string, modifiers?: { isAbstract?: boolean, isStatic?: boolean, isActive?: boolean }): string {
    // Si el nombre tiene genéricos (ej: List<User>), resolvemos al tipo base (List)
    const baseName = name.includes('<') ? name.substring(0, name.indexOf('<')) : name;

    const fqn = this.symbolTable.resolveFQN(baseName, namespace);
    const existing = this.symbolTable.get(fqn);

    if (!existing) {
      const { name: shortName, namespace: entityNamespace } = getNamespaceAndName(fqn);

      const entity: IREntity = {
        id: fqn,
        name: shortName,
        type: IREntityType.CLASS,
        members: [],
        isImplicit: true,
        isAbstract: modifiers?.isAbstract || false,
        isStatic: modifiers?.isStatic || false,
        isActive: modifiers?.isActive || false,
        namespace: entityNamespace
      };

      this.symbolTable.register(entity);
    } else if (existing.isImplicit && modifiers) {
      // Si la entidad es implícita y traemos nuevos modificadores, los actualizamos
      if (modifiers.isAbstract) existing.isAbstract = true;
      if (modifiers.isStatic) existing.isStatic = true;
      if (modifiers.isActive) existing.isActive = true;
    }

    return fqn;
  }

  private shouldCreateInferredRel(from: string, to: string, type: IRRelationshipType, label?: string): boolean {
    const exactMatch = this.relationships.some(rel =>
      rel.from === from &&
      rel.to === to &&
      rel.type === type &&
      rel.label === (label || '')
    );
    if (exactMatch) return false;

    if (type === IRRelationshipType.DEPENDENCY) {
      const strongerExists = this.relationships.some(rel =>
        rel.from === from &&
        rel.to === to &&
        rel.type !== IRRelationshipType.DEPENDENCY
      );
      if (strongerExists) return false;
    }

    return true;
  }

  /**
   * Elimina de las entidades aquellos atributos que ya están representados
   * como una relación estructural (Composición, Agregación, etc.).
   */
  private cleanupRedundantMembers(): void {
    const entities = this.symbolTable.getAllEntities();

    entities.forEach(entity => {
      // Solo nos importan los miembros que originan una relación desde esta entidad
      const outgoingRels = this.relationships.filter(rel => rel.from === entity.id);

      entity.members = entity.members.filter(member => {
        // Buscamos si hay una relación que "cubra" este miembro
        // Un miembro es redundante si su nombre coincide con el label de una relación saliente
        const isRedundant = outgoingRels.some(rel =>
          rel.label === member.name &&
          rel.type !== IRRelationshipType.INHERITANCE &&
          rel.type !== IRRelationshipType.IMPLEMENTATION
        );

        return !isRedundant;
      });
    });
  }
}

/**
 * Visitante para la primera pasada: Registro de entidades explícitas.
 */
class DeclarationVisitor implements ASTVisitor {
  constructor(
    private analyzer: SemanticAnalyzer,
    private symbolTable: SymbolTable,
    private currentNamespace: string[]
  ) { }

  visitProgram(node: ProgramNode): void {
    node.body.forEach(stmt => walkAST(stmt, this));
  }

  visitPackage(node: PackageNode): void {
    this.currentNamespace.push(node.name);
    node.body.forEach(stmt => walkAST(stmt, this));
    this.currentNamespace.pop();
  }

  visitEntity(node: EntityNode): void {
    const currentNS = this.currentNamespace.join('.');
    const fqn = currentNS ? (node.name.includes('.') ? node.name : `${currentNS}.${node.name}`) : node.name;

    const { name: shortName, namespace: entityNamespace } = getNamespaceAndName(fqn);

    const entity: IREntity = {
      id: fqn,
      name: shortName,
      type: this.mapEntityType(node.type),
      members: this.mapMembers(node.body || []),
      isImplicit: false,
      isAbstract: (node.type === ASTNodeType.CLASS) && (node as any).isAbstract === true,
      isStatic: (node.type === ASTNodeType.CLASS) && (node as any).isStatic === true,
      isActive: node.isActive || false,
      typeParameters: node.typeParameters,
      docs: node.docs,
      line: node.line,
      column: node.column,
      namespace: entityNamespace
    };

    this.symbolTable.register(entity);
  }

  visitRelationship(node: RelationshipNode): void { }
  visitComment(node: CommentNode): void { }

  private mapEntityType(type: ASTNodeType): IREntityType {
    switch (type) {
      case ASTNodeType.INTERFACE: return IREntityType.INTERFACE;
      case ASTNodeType.ENUM: return IREntityType.ENUM;
      default: return IREntityType.CLASS;
    }
  }

  private mapMembers(members: any[]): IRMember[] {
    return members
      .filter(m => m.type !== ASTNodeType.COMMENT)
      .map(m => ({
        name: m.name,
        type: m.typeAnnotation?.raw || m.returnType?.raw,
        visibility: this.mapVisibility(m.visibility),
        isStatic: m.isStatic || false,
        isAbstract: m.isAbstract || false,
        parameters: m.parameters?.map((p: any) => ({
          name: p.name,
          type: p.typeAnnotation?.raw || p.typeAnnotation,
          relationshipKind: p.relationshipKind
        })),
        // Para métodos, usar returnRelationshipKind; para atributos, usar relationshipKind
        relationshipKind: m.returnRelationshipKind || m.relationshipKind,
        multiplicity: m.multiplicity,
        docs: m.docs,
        line: m.line,
        column: m.column
      }));
  }

  private mapVisibility(v: string): IRVisibility {
    switch (v) {
      case '-': return IRVisibility.PRIVATE;
      case '#': return IRVisibility.PROTECTED;
      case '~': return IRVisibility.INTERNAL;
      default: return IRVisibility.PUBLIC;
    }
  }
}

/**
 * Visitante para la segunda pasada: Resolución de relaciones e implicidades.
 */
class RelationshipVisitor implements ASTVisitor {
  constructor(
    private analyzer: SemanticAnalyzer,
    private symbolTable: SymbolTable,
    private relationships: IRRelationship[],
    private currentNamespace: string[]
  ) { }

  visitProgram(node: ProgramNode): void {
    node.body.forEach(stmt => walkAST(stmt, this));
  }

  visitPackage(node: PackageNode): void {
    this.currentNamespace.push(node.name);
    node.body.forEach(stmt => walkAST(stmt, this));
    this.currentNamespace.pop();
  }

  visitEntity(node: EntityNode): void {
    const namespace = this.currentNamespace.join('.');
    const fromFQN = this.symbolTable.resolveFQN(node.name, namespace);

    node.relationships.forEach(rel => {
      const toFQN = this.analyzer.resolveOrRegisterImplicit(rel.target, namespace, { isAbstract: rel.targetIsAbstract });
      this.addRelationship(fromFQN, toFQN, rel.kind);
    });
  }

  visitRelationship(node: RelationshipNode): void {
    const namespace = this.currentNamespace.join('.');
    const fromFQN = this.analyzer.resolveOrRegisterImplicit(node.from, namespace, { isAbstract: node.fromIsAbstract });
    const toFQN = this.analyzer.resolveOrRegisterImplicit(node.to, namespace, { isAbstract: node.toIsAbstract });

    const irRel: IRRelationship = {
      from: fromFQN,
      to: toFQN,
      type: mapRelationshipType(node.kind),
      docs: node.docs,
      line: node.line,
      column: node.column
    };

    if (node.fromMultiplicity) irRel.fromMultiplicity = node.fromMultiplicity;
    if (node.toMultiplicity) irRel.toMultiplicity = node.toMultiplicity;
    if (node.label) irRel.label = node.label;

    this.relationships.push(irRel);
  }

  visitComment(node: CommentNode): void { }

  private addRelationship(from: string, to: string, kind: string): void {
    this.relationships.push({
      from,
      to,
      type: mapRelationshipType(kind)
    });
  }
}

function mapRelationshipType(kind: string): IRRelationshipType {
  const k = kind.trim();
  if (k === '>>' || k === '>extends') return IRRelationshipType.INHERITANCE;
  if (k === '>I' || k === '>implements') return IRRelationshipType.IMPLEMENTATION;
  if (k === '>*' || k === '>comp') return IRRelationshipType.COMPOSITION;
  if (k === '>+' || k === '>agreg') return IRRelationshipType.AGGREGATION;
  if (k === '>-' || k === '>use') return IRRelationshipType.DEPENDENCY;

  if (k.startsWith('>>')) return IRRelationshipType.INHERITANCE;
  if (k.startsWith('>I')) return IRRelationshipType.IMPLEMENTATION;
  if (k.startsWith('>*')) return IRRelationshipType.COMPOSITION;
  if (k.startsWith('>+')) return IRRelationshipType.AGGREGATION;
  if (k.startsWith('>-')) return IRRelationshipType.DEPENDENCY;

  return IRRelationshipType.ASSOCIATION;
}

function getNamespaceAndName(fqn: string): { namespace?: string; name: string } {
  let lastDotIndex = -1;
  let depth = 0;

  for (let i = 0; i < fqn.length; i++) {
    if (fqn[i] === '<') depth++;
    else if (fqn[i] === '>') depth--;
    else if (fqn[i] === '.' && depth === 0) {
      lastDotIndex = i;
    }
  }

  if (lastDotIndex === -1) {
    return { name: fqn };
  }

  return {
    namespace: fqn.substring(0, lastDotIndex),
    name: fqn.substring(lastDotIndex + 1)
  };
}
