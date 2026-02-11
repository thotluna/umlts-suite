---
name: dsl-parser-development
description: Expert guidance for designing domain-specific languages (DSLs) and implementing hand-written parsers for academic and professional purposes. Use when creating DSL syntax, writing formal grammars, implementing manual Lexers and Recursive Descent Parsers, designing JSON-serializable ASTs, and handling semantic validation without external heavy dependencies.
---

# DSL Design & Parser Development

A comprehensive skill for designing domain-specific languages and implementing robust parsers.

## When to Use This Skill

Use this skill when the user wants to:

- Design a new DSL syntax or improve an existing one
- Write formal grammars (EBNF, BNF, PEG)
- Implement hand-written parsers (Recursive Descent) for deep understanding and full control
- Implement Lexical Analyzers (Lexers) using state machines
- Design JSON-serializable Abstract Syntax Trees (ASTs) for cross-platform consumption
- Handle syntax validation and semantic analysis
- Design helpful error messages and recovery strategies
- Optimize parser performance
- Create Abstract Syntax Trees (ASTs)
- Implement language servers or IDE integrations

## Core Principles of Good DSL Design

### 1. User-Centric Design
- **Know your audience**: Developers? Domain experts? Non-technical users?
- **Match mental models**: Syntax should align with how users think about the domain
- **Minimize cognitive load**: Familiar patterns, clear keywords, logical structure
- **Progressive disclosure**: Simple things simple, complex things possible

### 2. Consistency & Predictability
- **Uniform syntax patterns**: Similar operations use similar syntax
- **Consistent naming**: Keywords and identifiers follow clear conventions
- **No surprising edge cases**: Behavior should be intuitive

### 3. Readability First
- **Favor clarity over brevity**: `create_user` is better than `cu`
- **Natural language where appropriate**: For non-technical users
- **Symbolic operators where expected**: For technical audiences familiar with them
- **Comments and documentation**: Built into the language

### 4. Error Prevention & Recovery
- **Catch errors early**: Validation at parse time when possible
- **Clear error messages**: Location, what went wrong, how to fix it
- **Graceful degradation**: Continue parsing to find multiple errors
- **Helpful suggestions**: "Did you mean X?" style hints

## Grammar Design Process

### Step 1: Define the Domain Concepts

Start by listing the key concepts in your domain:

```
For a UML DSL:
- Classes (with attributes, methods)
- Relationships (association, inheritance, composition, aggregation, dependency)
- Multiplicity
- Visibility modifiers (+, -, #, ~)
- Special modifiers (* abstract, $ static, & active)
- Stereotypes
```

### Step 2: Design the Concrete Syntax

Choose your syntax style based on your audience:

**Option A: Natural Language Style** (for non-technical users)
```
class User has:
  - name as text
  - email as text
  - age as number

User is connected to Order with "places" relationship
```

**Option B: Structured/Technical Style** (for developers)
```
class User {
  name: String
  email: String
  age: Number
}

User -> Order : places
```

**Option C: Hybrid Style** (balance)
```
class User:
  name: String
  email: String
  age: Number

relationship User "1" -> "0..*" Order: "places"
```

### Step 3: Write the Grammar

Choose your grammar formalism based on your parser tool:

**EBNF (Extended Backus-Naur Form)** - Good for documentation and LL parsers
```ebnf
Program        ::= Statement*
Statement      ::= EntityDef | RelationshipDef | PackageDef
EntityDef      ::= [Modifiers] EntityType Identifier [Modifiers] [Inheritance] [Implementations] Body
Modifiers      ::= (StaticOpt | AbstractOpt | ActiveOpt)*
EntityType     ::= 'class' | 'interface' | 'enum'
Body           ::= '{' Member* '}'
Member         ::= Visibility [StaticOpt] [AbstractOpt] (Method | Attribute)
```

**PEG (Parsing Expression Grammar)** - Good for PEG parsers (PEG.js, Pest)
```peg
Program     = Definition+
Definition  = ClassDef / RelationshipDef
ClassDef    = "class" _ id:Identifier _ "{" _ members:Member* _ "}"
Member      = id:Identifier _ ":" _ type:Type
```

**ANTLR4 Grammar** - For ANTLR parser generator
```antlr
grammar UML;

program: definition+ ;
definition: classDef | relationshipDef ;
classDef: 'class' ID '{' member* '}' ;
member: ID ':' type ;
type: 'String' | 'Number' | 'Boolean' | ID ;
```

### Step 4: Consider Lexical Structure

Define how tokens are recognized:

```
Keywords: class, relationship, extends, implements
Identifiers: [a-zA-Z_][a-zA-Z0-9_]*
Numbers: [0-9]+(\.[0-9]+)?
Strings: "..." or '...'
Comments: // single line, /* multi-line */
Whitespace: spaces, tabs, newlines (usually ignored)
```

## Parser Implementation Strategies

### Choosing a Parser Technology

**Custom Recursive Descent** ✅ **Best for Learning & Full Control**
- Pros: No external dependencies, easy to debug, maximum educational value, total control over error recovery.
- Cons: Manual work for error handling and lookahead.
- Use when: Academic projects, learning compilers, needing a lightweight engine.

**External Tools (ANTLR, Tree-sitter, etc.)** ⚠️ **Use only if explicitly requested**
- Pros: Speed of development for complex industrial languages.
- Cons: Heavy dependencies, less educational for "from scratch" learning.

### Parser Architecture Recommendations

```
Source Code
    ↓
┌─────────────┐
│   Lexer     │ → Tokens
└─────────────┘
    ↓
┌─────────────┐
│   Parser    │ → Parse Tree / CST
└─────────────┘
    ↓
┌─────────────┐
│ AST Builder │ → Abstract Syntax Tree
└─────────────┘
    ↓
┌─────────────┐
│  Semantic   │ → Validated AST + Symbol Table
│  Analyzer   │
└─────────────┘
    ↓
┌─────────────┐
│  Code Gen   │ → Output (diagrams, code, etc.)
└─────────────┘
```

## AST Design Best Practices

### Keep AST Nodes Simple and Typed

**Good AST Design:**
```typescript
interface ClassNode {
  type: 'ClassDeclaration'
  name: string
  members: MemberNode[]
  location: SourceLocation
}

interface MemberNode {
  type: 'MemberDeclaration'
  name: string
  dataType: TypeNode
  visibility?: 'public' | 'private' | 'protected'
  location: SourceLocation
}
```

**Include Source Locations:**
```typescript
interface SourceLocation {
  start: { line: number, column: number }
  end: { line: number, column: number }
}
```

This enables:
- Accurate error messages with line/column numbers
- IDE features like "go to definition"
- Syntax highlighting
- Hover tooltips

### Use the Visitor Pattern for AST Traversal

```typescript
interface ASTVisitor<T> {
  visitClass(node: ClassNode): T
  visitMember(node: MemberNode): T
  visitRelationship(node: RelationshipNode): T
}

class SemanticAnalyzer implements ASTVisitor<void> {
  visitClass(node: ClassNode): void {
    // Validate class
    for (const member of node.members) {
      this.visitMember(member)
    }
  }
  
  visitMember(node: MemberNode): void {
    // Validate member
  }
}
```

## Error Handling Strategies

### 1. Provide Context-Rich Error Messages

**Bad:**
```
Error: unexpected token
```

**Good:**
```
Error at line 5, column 12:
  class User {
            ^
Expected: identifier, found: '{'

Did you mean to add a class name?
Example: class User {
```

### 2. Implement Error Recovery

Allow the parser to continue after errors to find multiple issues:

```typescript
// Skip tokens until synchronization point
function synchronize() {
  while (!isAtEnd()) {
    if (previous().type === 'SEMICOLON') return
    
    switch (peek().type) {
      case 'CLASS':
      case 'FUNCTION':
      case 'IF':
        return
    }
    
    advance()
  }
}
```

### 3. Categorize Errors

```typescript
enum ErrorSeverity {
  Error,   // Blocks compilation
  Warning, // Should fix but doesn't block
  Info     // Suggestions for improvement
}

interface DiagnosticMessage {
  severity: ErrorSeverity
  message: string
  location: SourceLocation
  suggestion?: string
  relatedInfo?: DiagnosticMessage[]
}
```

## Semantic Analysis

After parsing, validate the AST semantically:

### 1. Symbol Table Management

```typescript
class SymbolTable {
  private scopes: Map<string, Symbol>[] = []
  
  enterScope() {
    this.scopes.push(new Map())
  }
  
  exitScope() {
    this.scopes.pop()
  }
  
  define(name: string, symbol: Symbol) {
    const currentScope = this.scopes[this.scopes.length - 1]
    
    if (currentScope.has(name)) {
      throw new Error(`Symbol '${name}' already defined`)
    }
    
    currentScope.set(name, symbol)
  }
  
  resolve(name: string): Symbol | undefined {
    // Look up from innermost to outermost scope
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name)) {
        return this.scopes[i].get(name)
      }
    }
    return undefined
  }
}
```

### 2. Type Checking

For typed DSLs, validate type compatibility:

```typescript
class TypeChecker implements ASTVisitor<Type> {
  visitAssignment(node: AssignmentNode): Type {
    const leftType = this.visit(node.left)
    const rightType = this.visit(node.right)
    
    if (!this.isAssignable(leftType, rightType)) {
      throw new TypeError(
        `Cannot assign ${rightType} to ${leftType}`,
        node.location
      )
    }
    
    return leftType
  }
}
```

### 3. Validation Rules

Implement domain-specific validation:

```typescript
class UMLValidator {
  validateClass(node: ClassNode) {
    // Check for duplicate members
    const memberNames = new Set<string>()
    
    for (const member of node.members) {
      if (memberNames.has(member.name)) {
        this.errors.push({
          message: `Duplicate member '${member.name}'`,
          location: member.location
        })
      }
      memberNames.add(member.name)
    }
  }
  
  validateRelationship(node: RelationshipNode) {
    // Check that referenced classes exist
    if (!this.symbolTable.resolve(node.source)) {
      this.errors.push({
        message: `Unknown class '${node.source}'`,
        location: node.location
      })
    }
  }
}
```

## Performance Optimization

### 1. Incremental Parsing

For IDE integration, support incremental updates:

```typescript
class IncrementalParser {
  private cachedNodes = new Map<string, ASTNode>()
  
  parse(source: string, changes: TextChange[]) {
    // Identify unchanged regions
    const affectedRange = this.computeAffectedRange(changes)
    
    // Reuse cached nodes outside affected range
    // Only re-parse affected portion
    
    return this.buildAST(source, affectedRange)
  }
}
```

### 2. Lazy Evaluation

Defer expensive operations:

```typescript
class LazyClass {
  private _members: MemberNode[] | undefined
  
  get members(): MemberNode[] {
    if (!this._members) {
      this._members = this.parseMembers()
    }
    return this._members
  }
}
```

## Testing Your Parser

### 1. Unit Tests for Grammar Rules

```typescript
describe('ClassParser', () => {
  it('parses simple class declaration', () => {
    const source = 'class User { name: String }'
    const ast = parse(source)
    
    expect(ast.type).toBe('ClassDeclaration')
    expect(ast.name).toBe('User')
    expect(ast.members).toHaveLength(1)
  })
  
  it('reports error for missing class name', () => {
    const source = 'class { name: String }'
    
    expect(() => parse(source)).toThrow(/expected identifier/i)
  })
})
```

### 2. Integration Tests with Real Examples

```typescript
describe('UML Parser Integration', () => {
  it('parses complete UML diagram', () => {
    const source = fs.readFileSync('examples/user-system.uml', 'utf-8')
    const ast = parse(source)
    
    // Validate structure
    expect(ast.classes).toHaveLength(3)
    expect(ast.relationships).toHaveLength(2)
  })
})
```

### 3. Error Recovery Tests

```typescript
it('recovers from multiple errors', () => {
  const source = `
    class User {
      name: String
      invalid syntax here
      age: Number
    }
    
    class Order {
      missing colon here String
    }
  `
  
  const { errors } = parseWithErrors(source)
  expect(errors).toHaveLength(2)
  expect(errors[0].line).toBe(4)
  expect(errors[1].line).toBe(9)
})
```

## Common Pitfalls to Avoid

### 1. Ambiguous Grammar

**Problem:**
```ebnf
Expression ::= Expression '+' Expression
             | Expression '*' Expression
             | Number
```

This grammar is ambiguous for `1 + 2 * 3`

**Solution:** Define precedence and associativity
```ebnf
Expression   ::= Term (('+' | '-') Term)*
Term         ::= Factor (('*' | '/') Factor)*
Factor       ::= Number | '(' Expression ')'
```

### 2. Left Recursion in LL Parsers

**Problem:**
```ebnf
Expression ::= Expression '+' Term  // Left-recursive!
```

**Solution:** Rewrite to use repetition
```ebnf
Expression ::= Term ('+' Term)*
```

### 3. Overly Complex Syntax

Keep it simple! Each syntactic construct should have a clear purpose.

**Too complex:**
```
class User <<entity, aggregate_root>> extends BaseUser implements Auditable, Serializable {
  @NotNull @Size(min=1, max=100) private String name
  @Deprecated(since="2.0", forRemoval=true) public void oldMethod()
}
```

**Simpler alternative:**
```
class User extends BaseUser {
  name: String(1..100)  // length constraint
}
```

### 4. Poor Error Messages

Invest time in good error messages - they make or break user experience!

## Integration with VSCode

For VSCode extensions, provide:

1. **Syntax Highlighting** (TextMate grammar or Tree-sitter)
2. **Diagnostics** (error squiggles)
3. **IntelliSense** (autocomplete)
4. **Hover Information**
5. **Go to Definition**
6. **Formatting**

See the VSCode Extension Development skill for details on Language Server Protocol integration.

## Recommended Reading & Resources

### Grammar & Parser Theory
- "Crafting Interpreters" by Robert Nystrom
- "Language Implementation Patterns" by Terence Parr
- Dragon Book (Compilers: Principles, Techniques, and Tools)

### Parser Generators
- ANTLR4: https://www.antlr.org/
- Tree-sitter: https://tree-sitter.github.io/
- PEG.js / Peggy: https://peggyjs.org/

### DSL Design
- "Domain-Specific Languages" by Martin Fowler
- "DSLs in Action" by Debasish Ghosh

## Example Workflow

When a user asks for help with DSL/parser development:

1. **Understand the domain**: What concepts need to be expressed?
2. **Define the target audience**: Technical level, familiarity with programming
3. **Sketch example syntax**: Show 2-3 syntax options
4. **Design the grammar**: Start with core concepts, add complexity incrementally
5. **Choose parser technology**: Based on ecosystem and requirements
6. **Implement incrementally**: Lexer → Parser → AST → Validation
7. **Add error handling**: Clear messages, recovery strategies
8. **Test thoroughly**: Unit tests, integration tests, error cases
9. **Optimize if needed**: Incremental parsing, caching

## Conclusion

Good DSL design is about finding the right balance between expressiveness, simplicity, and usability. The grammar is the foundation - invest time getting it right, and the rest will follow more easily.

Remember: **Your DSL is an interface, not just a parser. Design it like you would design any user interface - with empathy, clarity, and attention to the user experience.**
