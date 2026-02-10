import type { Token } from '../../lexer/token.types';
import { TokenType } from '../../lexer/token.types';
import type {
  EntityNode,
  MemberNode,
  RelationshipHeaderNode,
  AttributeNode,
  MethodNode,
  ParameterNode
} from '../ast/nodes';
import { ASTNodeType } from '../ast/nodes';
import type { ParserContext } from '../parser.context';
import type { StatementRule } from '../rule.types';

export class EntityRule implements StatementRule {
  public parse(context: ParserContext): EntityNode | null {
    const pos = context.getPosition();
    const isActive = context.match(TokenType.KW_ACTIVE, TokenType.MOD_ACTIVE);
    const isAbstract = context.match(TokenType.KW_ABSTRACT, TokenType.MOD_ABSTRACT);

    if (!context.match(TokenType.KW_CLASS, TokenType.KW_INTERFACE, TokenType.KW_ENUM)) {
      context.rollback(pos);
      return null;
    }

    const token = context.prev();
    let type: any = ASTNodeType.CLASS;
    if (token.type === TokenType.KW_INTERFACE) type = ASTNodeType.INTERFACE;
    if (token.type === TokenType.KW_ENUM) type = ASTNodeType.ENUM;

    const nameToken = context.consume(TokenType.IDENTIFIER, "Se esperaba el nombre de la entidad");

    // PUNTO IMPORTANTE: Consumir la documentación PENDIENTE antes de entrar en el cuerpo
    // Para evitar que el primer miembro se la robe si el parser entra en parseBody()
    const docs = context.consumePendingDocs();

    // Soporte para genéricos: <T, K>
    let typeParameters: string[] | undefined = undefined;
    if (context.match(TokenType.LT)) {
      typeParameters = [];
      do {
        const param = context.consume(TokenType.IDENTIFIER, "Se esperaba el nombre del parámetro de tipo");
        typeParameters.push(param.value);
      } while (context.match(TokenType.COMMA));
      context.consume(TokenType.GT, "Se esperaba '>' después de los parámetros de tipo");
    }

    // Parse relationship list in header
    const relationships: RelationshipHeaderNode[] = [];
    while (context.match(TokenType.OP_INHERIT, TokenType.OP_IMPLEMENT, TokenType.OP_COMP, TokenType.OP_AGREG, TokenType.OP_USE,
      TokenType.KW_EXTENDS, TokenType.KW_IMPLEMENTS, TokenType.KW_COMP, TokenType.KW_AGREG, TokenType.KW_USE, TokenType.GT)) {
      const kind = context.prev().value;
      const targetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT);
      let target = context.consume(TokenType.IDENTIFIER, "Se esperaba el nombre del objetivo de la relación").value;

      // Opcionalmente consumir argumentos de tipo: <string>
      if (context.match(TokenType.LT)) {
        target += '<';
        while (!context.check(TokenType.GT) && !context.isAtEnd()) {
          target += context.advance().value;
        }
        target += context.consume(TokenType.GT, "Se esperaba '>'").value;
      }

      relationships.push({
        type: ASTNodeType.RELATIONSHIP,
        kind,
        target,
        targetIsAbstract,
        line: context.prev().line,
        column: context.prev().column
      });
      // Comma opcional
      context.match(TokenType.COMMA);
    }

    // Parse body members
    let body: MemberNode[] | undefined = undefined;
    if (context.match(TokenType.LBRACE)) {
      body = [];
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        if (context.match(TokenType.DOC_COMMENT)) {
          context.setPendingDocs(context.prev().value);
          continue;
        }

        if (type === ASTNodeType.ENUM) {
          if (context.check(TokenType.COMMENT)) {
            const commentToken = context.consume(TokenType.COMMENT, "");
            body.push({
              type: ASTNodeType.COMMENT,
              value: commentToken.value,
              line: commentToken.line,
              column: commentToken.column
            });
            continue;
          }
          // Para enums, los miembros son simples identificadores
          if (context.check(TokenType.IDENTIFIER)) {
            const nameToken = context.consume(TokenType.IDENTIFIER, "Se esperaba el nombre del literal del enum");
            body.push({
              type: ASTNodeType.ATTRIBUTE, // Usamos ATTRIBUTE para representar el literal
              name: nameToken.value,
              visibility: 'public',
              isStatic: true,
              typeAnnotation: 'any',
              multiplicity: undefined,
              docs: context.consumePendingDocs(),
              line: nameToken.line,
              column: nameToken.column
            });
            // Soporte opcional para coma o simplemente espacio
            context.match(TokenType.COMMA);
          } else {
            // Si no es un identificador ni comentario y no es la llave de cierre, saltamos para evitar loop
            context.advance();
          }
        } else {
          const member = this.parseMember(context);
          if (member) body.push(member);
        }
      }
      context.consume(TokenType.RBRACE, "Se esperaba '}'");
    }

    return {
      type,
      name: nameToken.value,
      isAbstract,
      isActive,
      typeParameters,
      docs,
      relationships,
      body,
      line: token.line,
      column: token.column
    };
  }

  private parseMember(context: ParserContext): MemberNode | null {
    if (context.match(TokenType.DOC_COMMENT)) {
      context.setPendingDocs(context.prev().value);
      return this.parseMember(context);
    }

    if (context.check(TokenType.COMMENT)) {
      const token = context.consume(TokenType.COMMENT, "");
      return {
        type: ASTNodeType.COMMENT,
        value: token.value,
        line: token.line,
        column: token.column
      };
    }

    // Visibilidad opcional
    let visibility = 'public';
    if (context.match(TokenType.VIS_PUB, TokenType.VIS_PRIV, TokenType.VIS_PROT, TokenType.VIS_PACK)) {
      visibility = context.prev().value;
    } else if (context.match(TokenType.KW_PUBLIC, TokenType.KW_PRIVATE, TokenType.KW_PROTECTED, TokenType.KW_INTERNAL)) {
      visibility = context.prev().value;
    }

    const isStatic = context.match(TokenType.KW_STATIC, TokenType.MOD_STATIC);
    const isAbstract = context.match(TokenType.KW_ABSTRACT, TokenType.MOD_ABSTRACT);

    const nameToken = context.consume(TokenType.IDENTIFIER, "Se esperaba el nombre del miembro");

    if (context.check(TokenType.LPAREN)) {
      return this.parseMethod(context, nameToken, visibility, isStatic, isAbstract);
    } else {
      return this.parseAttribute(context, nameToken, visibility, isStatic);
    }
  }

  private parseAttribute(context: ParserContext, name: Token, visibility: string, isStatic: boolean): AttributeNode {
    context.consume(TokenType.COLON, "Se esperaba ':' después del nombre del atributo");

    // PUNTO 5.2 DE LA ESPECIFICACIÓN: Soporte de relaciones in-line
    let relationshipKind: string | undefined = undefined;
    if (context.match(
      TokenType.OP_INHERIT, TokenType.OP_IMPLEMENT, TokenType.OP_COMP,
      TokenType.OP_AGREG, TokenType.OP_USE, TokenType.OP_GENERIC_REL
    )) {
      relationshipKind = context.prev().value;
    }

    const targetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT);
    const typeAnnotation = this.parseType(context);
    let multiplicity: string | undefined = undefined;

    if (context.match(TokenType.LBRACKET)) {
      multiplicity = '[';
      while (!context.check(TokenType.RBRACKET) && !context.isAtEnd()) {
        multiplicity += context.advance().value;
      }
      multiplicity += context.consume(TokenType.RBRACKET, "Se esperaba ']'").value;
    }

    return {
      type: ASTNodeType.ATTRIBUTE,
      name: name.value,
      visibility,
      isStatic,
      typeAnnotation,
      multiplicity,
      relationshipKind,
      targetIsAbstract,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column
    };
  }

  private parseMethod(context: ParserContext, name: Token, visibility: string, isStatic: boolean, isAbstract: boolean): MethodNode {
    context.consume(TokenType.LPAREN, "");
    const parameters: ParameterNode[] = [];

    if (!context.check(TokenType.RPAREN)) {
      do {
        const paramName = context.consume(TokenType.IDENTIFIER, "Se esperaba el nombre del parámetro");
        context.consume(TokenType.COLON, "Se esperaba ':'");

        // SOPORTE SECCIÓN 5.3: Operadores de relación en parámetros
        let relationshipKind: string | undefined = undefined;
        if (context.match(
          TokenType.OP_INHERIT, TokenType.OP_IMPLEMENT, TokenType.OP_COMP,
          TokenType.OP_AGREG, TokenType.OP_USE, TokenType.OP_GENERIC_REL
        )) {
          relationshipKind = context.prev().value;
        }

        const targetIsAbstract = context.match(TokenType.MOD_ABSTRACT, TokenType.KW_ABSTRACT);
        const typeAnnotation = this.parseType(context);
        parameters.push({
          type: ASTNodeType.PARAMETER,
          name: paramName.value,
          typeAnnotation,
          relationshipKind,
          targetIsAbstract,
          line: paramName.line,
          column: paramName.column
        });
      } while (context.match(TokenType.COMMA));
    }

    context.consume(TokenType.RPAREN, "Se esperaba ')' después de los parámetros");

    let returnType = 'void';
    if (context.match(TokenType.COLON)) {
      returnType = this.parseType(context);
    }

    return {
      type: ASTNodeType.METHOD,
      name: name.value,
      visibility,
      isStatic,
      isAbstract,
      parameters,
      returnType,
      docs: context.consumePendingDocs(),
      line: name.line,
      column: name.column
    };
  }

  private parseType(context: ParserContext): string {
    const nextToken = context.peek();
    if (nextToken.type !== TokenType.IDENTIFIER) {
      throw new Error(`Se esperaba un tipo en línea ${nextToken.line}, columna ${nextToken.column}`);
    }

    let type = context.advance().value;

    if (context.match(TokenType.LT)) {
      type += '<';
      while (!context.check(TokenType.GT) && !context.isAtEnd()) {
        type += context.advance().value;
      }
      type += context.consume(TokenType.GT, "Se esperaba '>'").value;
    }

    return type;
  }
}
