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
            this.inferFromType(entity.id, member.type, entity.namespace, member.name, relType, member.multiplicity);
          }
        }

        // 2. Inferir de los parámetros del método
        if (member.parameters) {
          member.parameters.forEach(param => {
            if (param.relationshipKind) {
              const relType = mapRelationshipType(param.relationshipKind);
              this.inferFromType(entity.id, param.type, entity.namespace, param.name, relType);
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
    multiplicity?: string
  ): void {
    const primitives = [
      'string', 'number', 'boolean', 'void', 'any', 'unknown', 'never', 'object',
      'cadena', 'fecha', 'entero', 'booleano', 'int', 'float', 'double', 'char',
      'horadía', 'date', 'time', 'datetime'
    ];
    if (primitives.includes(typeName.toLowerCase())) return;

    const baseType = typeName.replace(/[\[\]]/g, '');
    const toFQN = this.resolveOrRegisterImplicit(baseType, fromNamespace || '');

    if (this.shouldCreateInferredRel(fromFQN, toFQN, relType)) {
      this.relationships.push({
        from: fromFQN,
        to: toFQN,
        type: relType,
        label: label || '',
        toMultiplicity: multiplicity
      });
    }
  }

  /**
   * Resuelve un nombre y si no existe en la tabla de símbolos, lo registra como implícito.
   */
  public resolveOrRegisterImplicit(name: string, namespace: string): string {
    const fqn = this.symbolTable.resolveFQN(name, namespace);

    if (!this.symbolTable.has(fqn)) {
      // Extraer nombre corto si el nombre original incluía puntos
      const shortName = name.includes('.') ? name.substring(name.lastIndexOf('.') + 1) : name;

      const entity: IREntity = {
        id: fqn,
        name: shortName,
        type: IREntityType.CLASS,
        members: [],
        isImplicit: true,
        isAbstract: false,
        isActive: false
      };

      // Namespace se extrae del FQN resuelto
      if (fqn.includes('.')) {
        entity.namespace = fqn.substring(0, fqn.lastIndexOf('.'));
      } else if (namespace) {
        entity.namespace = namespace;
      }

      this.symbolTable.register(entity);
    }

    return fqn;
  }

  private shouldCreateInferredRel(from: string, to: string, type: IRRelationshipType): boolean {
    const exactMatch = this.relationships.some(rel => rel.from === from && rel.to === to && rel.type === type);
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

    // Extraer short name si el nombre original incluía puntos
    const shortName = node.name.includes('.') ? node.name.substring(node.name.lastIndexOf('.') + 1) : node.name;

    const entity: IREntity = {
      id: fqn,
      name: shortName,
      type: this.mapEntityType(node.type),
      members: this.mapMembers(node.body || []),
      isImplicit: false,
      isAbstract: (node.type === ASTNodeType.CLASS) && (node as any).isAbstract === true,
      isActive: node.isActive || false,
      typeParameters: node.typeParameters,
      docs: node.docs,
      line: node.line,
      column: node.column
    };

    // Namespace se extrae del FQN resuelto
    if (fqn.includes('.')) {
      entity.namespace = fqn.substring(0, fqn.lastIndexOf('.'));
    } else if (currentNS) {
      entity.namespace = currentNS;
    }

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
        type: m.typeAnnotation || m.returnType,
        visibility: this.mapVisibility(m.visibility),
        isStatic: m.isStatic || false,
        isAbstract: m.isAbstract || false,
        parameters: m.parameters?.map((p: any) => ({
          name: p.name,
          type: p.typeAnnotation,
          relationshipKind: p.relationshipKind
        })),
        relationshipKind: m.relationshipKind,
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
      const toFQN = this.analyzer.resolveOrRegisterImplicit(rel.target, namespace);
      this.addRelationship(fromFQN, toFQN, rel.kind);
    });
  }

  visitRelationship(node: RelationshipNode): void {
    const namespace = this.currentNamespace.join('.');
    const fromFQN = this.analyzer.resolveOrRegisterImplicit(node.from, namespace);
    const toFQN = this.analyzer.resolveOrRegisterImplicit(node.to, namespace);

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
