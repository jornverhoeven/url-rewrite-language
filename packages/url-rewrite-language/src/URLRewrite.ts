import { Expression, Variable } from "./Expressions";
import { RewriteEvaluator } from "./RewriteEvaluator";

export abstract class PathSegment {
    prefix: undefined | string = "/";
    abstract toPath(): string;
}
export class StringSegment extends PathSegment {
    constructor(public value: string) {
        super();
    }

    toPath() {
        return this.prefix + this.value;
    }
}
export class VariableSegment extends PathSegment {
    constructor(public variable: Variable, public attributes?: { quantifier?: Quantifier, pattern?: Pattern }) {
        super();
        this.attributes ??= {};
        this.attributes.pattern ??= new Pattern("[^\\/]+");
    }

    toPath() {
        return this.prefix + ":" + this.variable.name + (this.attributes?.pattern ?? "") + (this.attributes?.quantifier ?? "");
    }
}
export class ComplexSegment extends PathSegment {
    constructor(public segments: PathSegment[]) {
        super();
    }

    toPath() {
        return this.segments.reduce((acc, segment) => acc + segment.toPath(), "");
    }
}

export class Query {
    constructor(public name: string, public value: string | Variable, public pattern?: Pattern) {
        this.pattern ??= new Pattern("[^&]+");
    }
}
export class Modifier { }
export class Quantifier extends Modifier {
    constructor(public value: string) {
        super();
    }
    toString() { return this.value; }
}
export class Pattern extends Modifier {
    constructor(public value: string) {
        super();
    }
    toString() { return `${this.value}` };
}

export class Path {
    constructor(public path: PathSegment[], public queries?: Query[]) { }

    toString() {
        return this.path.reduce((acc, segment) => acc + segment.toPath(), "");
    }
    
    public build(variables: Record<string, string | string[]>): string {
        return this.path.reduce<string>((acc, segment) => {
            if (segment instanceof VariableSegment) {
                const value = variables[segment.variable.name];
                if (Array.isArray(value)) {
                    if (segment.attributes?.quantifier?.value !== "*" && segment.attributes?.quantifier?.value !== "+")
                        throw new Error(`Variable :${segment.variable.name} is not an array`);
                    return acc + value.map(v => segment.prefix + v).join("");
                }
                if (segment.attributes?.quantifier?.value === "*" || segment.attributes?.quantifier?.value === "+")
                    throw new Error(`Value '${value}' of :${segment.variable.name} is not an array`);
                return acc + segment.prefix + value;
            }
            return acc + segment.toPath();
        }, "");
    }

    extractVariables(url: URL): Record<string, string | string[]> {
        return {
            ...this.extractVariablesFromPath(url),
            ...this.extractVariablesFromQuery(url)
        };
    }
    private extractVariablesFromPath(url: URL): Record<string, string | string[]> {
        const match = url.pathname.match(this.regexp);
        if (!match) return {};

        const result: Record<string, string | string[]> = {};
        for (const key in match.groups) {
            const value = match.groups[key];
            if (value.includes("/")) {
                result[key] = value.split("/").filter(Boolean);
            } else {
                result[key] = value;
            }
        }
        const variableSegment = this.path.filter(segment => segment instanceof VariableSegment) as VariableSegment[];
        for (const segment of variableSegment) {
            if (result[segment.variable.name]) continue;
            if (segment.attributes?.quantifier) result[segment.variable.name] = [];
            else result[segment.variable.name] = "";
        }
        return result;
    }
    private extractVariablesFromQuery(url: URL): Record<string, string | string[]> {
        const searchParams = new URLSearchParams(url.search);
        const result: Record<string, string | string[]> = {};
        for (const query of this.queries ?? []) {
            if (query.value instanceof Variable) {
                result[query.value.name] = searchParams.get(query.name) ?? "";
            }
        }
        return result;
    }

    public get variables(): Variable[] {
        return this.path.filter(segment => segment instanceof VariableSegment)
            .map(segment => (segment as VariableSegment).variable);
    }

    public get regexp() {
        const regexp = this.path.reduce<string>((acc, segment) => {
            return acc + segmentToRegexp(segment);
        }, "^") + "$";
        return new RegExp(regexp);

        function segmentToRegexp(segment: PathSegment): string {
            if (segment instanceof VariableSegment) {
                return `(?<${segment.variable.name}>(?:${segment.prefix}${segment.attributes?.pattern})${segment.attributes?.quantifier})`;
            }
            if (segment instanceof StringSegment) {
                return `${segment.prefix}${segment.value}`;
            }
            if (segment instanceof ComplexSegment) {
                return segment.segments.map(segmentToRegexp).join("");
            }
            return '';
        }
    }
}

export class URLRewrite {
    constructor(public path: Path, public destination: Path, public expressions: Expression[]) { }

    matches(path: string): boolean;
    matches(url: URL): boolean;
    matches(url: string | URL): boolean {
        if (typeof url === "string") url = new URL(url);
        return this.path.regexp.test(url.pathname) && (this.path.queries?.every(query => {
            const value = url.searchParams.get(query.name);
            if (!value) return false;

            if (query.value instanceof Variable) {
                if (query.pattern) {
                    const regexp = new RegExp(query.pattern.value);
                    return regexp.test(value);
                }
                return true;
            }
            return query.value === url.searchParams.get(query.name); 
        }) ?? true);
    }

    evaluate(url: string, evaluator?: RewriteEvaluatorFactory): Promise<URL>;
    evaluate(url: URL, evaluator?: RewriteEvaluatorFactory): Promise<URL>;
    evaluate(url: string | URL, evaluator: RewriteEvaluatorFactory = (u) => new RewriteEvaluator(u)): Promise<URL> {
        return evaluator(this).evaluate(url as URL);
    }
}

type RewriteEvaluatorFactory = (urlRewrite: URLRewrite) => RewriteEvaluator;
