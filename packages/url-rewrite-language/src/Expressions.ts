export class Expression { }

export class Primitive<T> extends Expression { 
    public value!: T;
}
export class Number extends Primitive<number> {
    constructor(public value: number) { super(); }
    public toString() { return this.value.toString(); }
}
export class String extends Primitive<string> {
    constructor(public value: string) { super(); }
    public toString() { return this.value.toString(); }
}
export class Boolean extends Primitive<boolean> {
    constructor(public value: boolean) { super(); }
    public toString() { return this.value.toString(); }
}
export class Array<T> extends Primitive<T[]> {
    constructor(public value: T[]) { super(); }
    public toString() { return this.value.toString(); }
}
export class Variable extends Expression {
    constructor(public name: string) { super(); }
}
export class Assignment extends Expression {
    constructor(public variable: Variable, public expression: Expression) { super(); }
}
export class FunctionCall extends Expression {
    constructor(public name: string, public args: Expression[]) { super(); }
}
