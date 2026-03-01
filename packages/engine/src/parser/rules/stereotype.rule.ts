import { TokenType } from '@engine/syntax/token.types'
import { UMLMetaclass } from '@engine/core/metamodel'
import type { TaggedValueDefinitionNode, StereotypeNode } from '@engine/syntax/nodes'
import type { IParserHub } from '@engine/parser/core/parser.hub'
import type { Orchestrator } from '@engine/parser/rule.types'
import { ASTFactory } from '@engine/parser/factory/ast.factory'
import { TypeRule } from '@engine/parser/rules/type.rule'

/**
 * StereotypeRule: Parsea la definición de un estereotipo dentro de un perfil.
 */
export class StereotypeRule {
  public canHandle(context: IParserHub): boolean {
    return context.check(TokenType.KW_STEREOTYPE)
  }

  public parse(context: IParserHub, _orchestrator: Orchestrator): StereotypeNode {
    const startToken = context.consume(TokenType.KW_STEREOTYPE, "Expected 'stereotype'")
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Stereotype name expected')

    const extensions: UMLMetaclass[] = []
    const KEYWORD_TO_METACLASS: Record<string, UMLMetaclass> = {
      class: UMLMetaclass.CLASS,
      interface: UMLMetaclass.INTERFACE,
      enum: UMLMetaclass.ENUMERATION,
      package: UMLMetaclass.PACKAGE,
      property: UMLMetaclass.PROPERTY,
      operation: UMLMetaclass.OPERATION,
      association: UMLMetaclass.ASSOCIATION,
    }

    if (context.match(TokenType.OP_INHERIT)) {
      do {
        const next = context.peek()
        let metaclass: UMLMetaclass | undefined

        // Case 1: Direct identifier (e.g. >> Class)
        if (next.type === TokenType.IDENTIFIER) {
          metaclass = next.value as UMLMetaclass
        }
        // Case 2: Keyword (e.g. >> class)
        else if (next.type.startsWith('KW_')) {
          metaclass = KEYWORD_TO_METACLASS[next.value.toLowerCase()]
        }

        if (metaclass && Object.values(UMLMetaclass).includes(metaclass)) {
          extensions.push(metaclass)
          context.advance()
        } else {
          context.addError('Valid UML Metaclass name or keyword expected', next)
          context.advance() // Avoid infinite loop
        }
      } while (context.match(TokenType.COMMA))
    }

    const properties: TaggedValueDefinitionNode[] = []
    if (context.match(TokenType.LBRACE)) {
      while (!context.check(TokenType.RBRACE) && !context.isAtEnd()) {
        try {
          const prop = this.parsePropertyDefinition(context, _orchestrator)
          if (prop) properties.push(prop)
        } catch (e: unknown) {
          context.addError(e instanceof Error ? e.message : 'Error parsing stereotype property')
          context.advance()
        }
      }
      context.softConsume(TokenType.RBRACE, "Expected '}' after stereotype body")
    }

    return ASTFactory.createStereotype(
      nameToken.value,
      extensions,
      properties,
      startToken.line,
      startToken.column,
    )
  }

  private parsePropertyDefinition(
    context: IParserHub,
    _orchestrator: Orchestrator,
  ): TaggedValueDefinitionNode {
    const nameToken = context.softConsume(TokenType.IDENTIFIER, 'Property name expected')
    context.softConsume(TokenType.COLON, "Expected ':' after property name")

    const typeRule = new TypeRule()
    const typeNode = typeRule.parse(context)

    let defaultValue: string | number | boolean | undefined
    if (context.match(TokenType.EQUALS)) {
      const val = context.peek()
      if (val.type === TokenType.STRING) {
        defaultValue = val.value.replace(/^["']|["']$/g, '')
        context.advance()
      } else if (val.type === TokenType.NUMBER) {
        defaultValue = Number(val.value)
        context.advance()
      } else if (val.value === 'true' || val.value === 'false') {
        defaultValue = val.value === 'true'
        context.advance()
      } else {
        context.addError('Default value must be String, Number or Boolean', val)
        context.advance()
      }
    }

    return ASTFactory.createTaggedValueDefinition(
      nameToken.value,
      typeNode,
      nameToken.line,
      nameToken.column,
      defaultValue,
    )
  }
}
