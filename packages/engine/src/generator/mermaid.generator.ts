import type { IRDiagram, IREntity, IRRelationship } from './ir/models';
import { IREntityType, IRRelationshipType, IRVisibility } from './ir/models';

/**
 * Generador de código Mermaid a partir de la Representación Intermedia (IR).
 */
export class MermaidGenerator {
  public generate(diagram: IRDiagram): string {
    const lines: string[] = ['classDiagram'];

    // 1. Generar Entidades
    diagram.entities.forEach(entity => {
      lines.push(...this.generateEntity(entity));
    });

    // 2. Generar Relaciones
    diagram.relationships.forEach(rel => {
      lines.push(...this.generateRelationship(rel));
    });

    return lines.join('\n');
  }

  private generateEntity(entity: IREntity): string[] {
    const lines: string[] = [];
    const typeLabel = this.getTypeLabel(entity);

    lines.push(`    class ${this.escapeId(entity.id)}["${entity.name}"] {`);

    if (typeLabel) {
      lines.push(`      <<${typeLabel}>>`);
    }

    // Miembros (Filtrar los que ya son relaciones para evitar redundancia visual "porquería")
    entity.members
      .filter(member => !member.relationshipKind)
      .forEach(member => {
        let line = `      `;
        line += member.visibility;

        if (member.parameters) {
          const abstractPrefix = member.isAbstract ? '*' : '';
          const staticSuffix = member.isStatic ? '$' : '';
          line += `${abstractPrefix}${member.name}${staticSuffix}(${member.parameters.map(p => `${p.type} ${p.name}`).join(', ')})`;
          if (member.type) {
            line += ` ${member.type}`;
          }
        } else {
          if (member.type && member.type !== 'any') {
            line += `${member.type} `;
          }
          const staticSuffix = member.isStatic ? '$' : '';
          line += `${member.name}${staticSuffix}`;
        }
        lines.push(line);
      });

    lines.push(`    }`);
    return lines;
  }

  private generateRelationship(rel: IRRelationship): string[] {
    const arrow = this.getRelationshipArrow(rel.type);
    const from = this.escapeId(rel.from);
    const to = this.escapeId(rel.to);

    let line = `    ${from} ${arrow} ${to}`;

    // Estándar UML: Los nombres de atributos in-line son ROLES en el destino
    const roleLabel = rel.label ? ` ${rel.label.replace(/:/g, '-').trim()}` : '';
    const toMult = rel.toMultiplicity ? `${rel.toMultiplicity}${roleLabel}` : roleLabel;

    if (rel.fromMultiplicity || toMult) {
      line = `    ${from} "${rel.fromMultiplicity || ''}" ${arrow} "${toMult.trim()}" ${to}`;
    }

    return [line];
  }

  private getTypeLabel(entity: IREntity): string {
    if (entity.isAbstract) return 'abstract';
    switch (entity.type) {
      case IREntityType.INTERFACE: return 'interface';
      case IREntityType.ENUM: return 'enumeration';
      default: return '';
    }
  }

  private getRelationshipArrow(type: IRRelationshipType): string {
    switch (type) {
      case IRRelationshipType.INHERITANCE: return '--|>';
      case IRRelationshipType.IMPLEMENTATION: return '..|>';
      case IRRelationshipType.COMPOSITION: return '--*';
      case IRRelationshipType.AGGREGATION: return '--o';
      case IRRelationshipType.DEPENDENCY: return '..>';
      case IRRelationshipType.ASSOCIATION: return '-->';
      default: return '--';
    }
  }

  private escapeId(id: string): string {
    let escaped = id.replace(/\./g, '_');
    escaped = escaped.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return escaped.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
