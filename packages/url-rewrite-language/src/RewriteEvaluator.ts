import { Assignment, Expression, FunctionCall, Primitive, String, Variable, Array as EArray, Number, Boolean } from "./Expressions";
import { URLRewrite } from "./URLRewrite";
import * as defaultFunctions from "./functions";

export class RewriteEvaluator {
    constructor(private readonly urlRewrite: URLRewrite, private readonly functions: Record<string, any> = defaultFunctions) { }

    public evaluate(url: string): Promise<URL>;
    public evaluate(url: URL): Promise<URL>;
    public async evaluate(url: string | URL): Promise<URL> {
        if (typeof url === "string") url = new URL(url);
        if (!this.urlRewrite.matches(url)) throw new EvaluationError("URL does not match LQL");
        const variables = this.urlRewrite.path.extractVariables(url);

        const context = new EvaluationContext();
        context.variables = variables;
        context.functions = this.functions;

        if (this.urlRewrite.expressions) {
            for (const expression of this.urlRewrite.expressions) {
                await this.evaluateExpression(expression, context);
            }
        }

        const destinationPath = this.urlRewrite.destination.build(variables);
        return new URL(destinationPath, url.origin);
    }

    private async evaluateExpression(expression: Expression, context: EvaluationContext): Promise<Expression> {
        if (expression instanceof Assignment) {
            const value = await this.evaluateExpression(expression.expression, context);
            if (!(expression.variable instanceof Variable)) 
                throw new EvaluationError("Assignment must be to a variable");
            context.variables[expression.variable.name] = value as VariableValue;
            return value;
        } else if (expression instanceof FunctionCall) {
            const fn = context.functions[expression.name];
            if (!fn) throw new EvaluationError(`Function ${expression.name} not found`);
            const args = await Promise.all(expression.args.map(arg => this.evaluateExpression(arg, context)));
            return await fn(...args as Primitive<any>[]);
        } else if (expression instanceof Variable) {
            const value = context.variables[expression.name];
            if (value === undefined) throw new EvaluationError(`Variable ${expression.name} not found`);
            if (value instanceof Primitive) return value;
            if (value instanceof Variable) return this.evaluateExpression(value, context);
            if (Array.isArray(value)) return new EArray(value);
            else if ("number" === typeof value) return new Number(value);
            else if ("boolean" === typeof value) return new Boolean(value);
            else if ("string" === typeof value) return new String(value);
            throw new EvaluationError(`Variable :${expression.name} is of unknown type`);
        } else if (expression instanceof Primitive){
            return expression;
        }
        throw new EvaluationError("Unknown expression type");
    }
}

type VariableValue = string | string[] | number | boolean | Variable;
type RedirectFunction<T> = (...args: Primitive<any>[]) => Promise<Primitive<T>>;
class EvaluationContext { 
    public variables: Record<string, VariableValue> = {};
    public functions: Record<string, RedirectFunction<unknown>> = {};
}

class EvaluationError extends Error { }
