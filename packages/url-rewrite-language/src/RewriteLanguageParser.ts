import { ComplexSegment, Path, Modifier, PathSegment, Pattern, Quantifier, Query, StringSegment, VariableSegment, URLRewrite } from "./URLRewrite";
import { Variable } from "./Expressions";
import { map, choice, sequence, optional, between, chain, number, skip, separatedBy, stringLiteral, string } from "@jornverhoeven/parser";
import { ParseError, Parser, char, many, many1, satisfy, spaces } from "@jornverhoeven/parser";
import * as Exs from "./Expressions";

export function variable(): Parser<string> {
    return map(many1(variableChar()), r => r.join(""));

    function variableChar(): Parser<string> {
        return satisfy(c => c.match(/[a-zA-Z0-9_\-]/) !== null, "variable character");
    }
}

export function pathSegment(): Parser<PathSegment> {
    return map(sequence(char("/"), many(choice(pathVariable(), pathString()))), r => {
        if (r[1] instanceof ParseError) return r;
        if (r[0] === "/" && r[1].length === 0) return new StringSegment("");
        if (r[1].length === 1) return r[1][0];
        // Remove prefix from all segments except the first
        r[1].forEach((segment, index) => {
            if (index === 0) return;
            segment.prefix = undefined;
        });
        return new ComplexSegment(r[1]);
    }) as Parser<PathSegment>;

    function pathString(): Parser<PathSegment> {
        return map(many(satisfy((c, prev) => c !== " " && c !== "/" && !(c === ":" && prev !== "\\"), "path character")), r => new StringSegment(r.join("")));
    }
    function pathVariable(): Parser<PathSegment> {
        return map(sequence(satisfy((c, prev) => c === ":" && prev !== "\\"), variable(), pathVariableModifier()), r => {
            const attributes = {} as { quantifier?: Quantifier, pattern?: Pattern };
            if (r[2] && r[2] instanceof Quantifier) attributes.quantifier = r[2];
            if (r[2] && r[2] instanceof Pattern) attributes.pattern = r[2];
            return new VariableSegment(new Variable(r[1] as string), attributes);
        });
    }
    function pathVariableModifier(): Parser<undefined | Modifier> {
        return optional(choice(pathVariableQuantifier(), pathPattern()));
    }
    function pathVariableQuantifier(): Parser<Quantifier> {
        return map(choice(char("+"), char("?"), char("*")), r => new Quantifier(r));
    }
    function pathPattern(): Parser<Pattern> {
        return map(between(many(satisfy((c, prev) => c !== ")" && prev !== "\\")), char("("), char(")")), r => new Pattern(r.join("")));
    }
}

export function path(): Parser<PathSegment[]> {
    return many1(pathSegment());
}

export function queryParam(): Parser<Query> {
    return map(sequence(string("??"), variable(), char("="), choice(
        sequence(queryVariable(), optional(queryPattern())),
        map(variable(), r => [r, undefined] as any)
    )), r => {
        const [variableOrValue, pattern] = r[3];
        return new Query(r[1] as string, variableOrValue, pattern);
    });

    function queryPattern(): Parser<Pattern> {
        return map(between(many(satisfy((c, prev) => c !== ")" && prev !== "\\")), char("("), char(")")), r => new Pattern(r.join("")));
    }
    function queryVariable(): Parser<Variable> {
        return map(chain(char(":"), () => variable()), r => new Variable(r as string));
    }
}

export function fullPath(): Parser<Path> {
    return map(sequence(path(), many(query())), r => {
        if (r[0] instanceof ParseError || r[1] instanceof ParseError) return r;
        const [path, queries] = r;
        return new Path(path, queries);
    }) as Parser<Path>;

    function query() {
        return chain(optional(spaces()), () => queryParam());
    }
}

export function assignment(): Parser<Exs.Assignment> {
    return map(sequence(char(":"), variable(), skip(spaces()), string("<-"), skip(spaces()), expression()), r => {
        const [_, variable, __, ___, ____, expression] = r;
        return new Exs.Assignment(new Exs.Variable(variable as string), expression as Exs.Expression);
    });
}

export function functionCall(): Parser<Exs.FunctionCall> {
    return map(sequence(variable(), char("("), args(), char(")")), r => {
        const [name, _, args, __] = r;
        return new Exs.FunctionCall(name as string, args as Exs.Expression[]);
    });

    function args() {
        return separatedBy(expression(), separator());
    }
    function separator() {
        return map(sequence(spaces(), char(","), spaces()), ([_, r]) => r);
    }
}

export function boolean(): Parser<Exs.Boolean> {
    return choice(
        map(string("true"), () => new Exs.Boolean(true)),
        map(string("false"), () => new Exs.Boolean(false))
    );
}

export function expression(): Parser<Exs.Expression> {
    // Does not include assignment
    return choice<Exs.Expression>(
        _stringLiteral(),
        _number(),
        boolean(),
        _variable(),
        antiCycle(functionCall)
    );

    function _stringLiteral(): Parser<Exs.String> {
        return map(stringLiteral(), r => new Exs.String(r));
    }
    function _number(): Parser<Exs.Number> {
        return map(number(), r => new Exs.Number(r));
    }
    function _variable(): Parser<Exs.Variable> {
        return map(chain(char(":"), () => variable()), r => new Exs.Variable(r));
    }
    // This is a workaround as otherwise there is a circular dependency
    function antiCycle<T>(parser: () => Parser<T>): Parser<T> {
        return (input, current) => parser()(input, current);
    }
}
export function fullExpression(): Parser<any> {
    // Includes assignment
    return choice(assignment(), expression());
}

export function parseUrlRewrite(): Parser<URLRewrite> {
    return map(sequence(fullPath(), expressions(), spaces(), char("|"), spaces(), fullPath()), r => {
        const path = r[0] as Path;
        const expressions = r[1] ? r[1] : [];
        const destination = r[5] as Path;
        return new URLRewrite(path, destination, expressions as Exs.Expression[]);
    });

    function expressions(): Parser<Exs.Expression[]> {
        return (input, current) => {
            let iterations = 0;
            const expressions: Exs.Expression[] = [];
            while (iterations < 100) {
                iterations++;
                const [c, r] = sequence(spaces(), char("|"), spaces(), fullExpression(), spaces())(input, current);
                if (r instanceof ParseError) {
                    // If we find a full path next, we can stop
                    const [_, _r] = sequence(spaces(), char("|"), spaces(), fullPath())(input, current);
                    if (_r instanceof ParseError) return [0, r];
                    return [current, expressions];
                }
                current = c;
                expressions.push(r[3] as Exs.Expression);
            }
            return [current, expressions];
        }
    }
}
