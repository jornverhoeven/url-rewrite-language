import { ParseError, Parser } from "@jornverhoeven/parser";
import { assignment, expression, fullExpression, fullPath, functionCall, parseUrlRewrite, path, pathSegment, queryParam, variable } from "../src/RewriteLanguageParser";
import { ComplexSegment, Path, Pattern, Quantifier, Query, StringSegment, URLRewrite, VariableSegment } from "../src/URLRewrite";
import { Assignment, Variable, Number, FunctionCall, Boolean, String } from "../src/Expressions";

describe("RewriteLanguageParser", () => {
    describe("variable", () => {
        it.each([
            "a",
            "A",
            "0",
            "_",
            "-",
            "aA0_-",
            "something",
            "something_else",
            "something-else",
        ])("should parse a variable name (%s)", (i) => {
            expectParser(variable(), i, i);
        })

        it("should throw an error for invalid variable names", () => {
            const [c, r] = variable()(" asd", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected input, expected at least one match at position 0");
        });
    });

    describe("pathSegment", () => {
        it("should parse a string segment", () => {
            expectParser(pathSegment(), "/string", new StringSegment("string"));
        });
        it("should parse a variable segment", () => {
            expectParser(pathSegment(), "/:variable", new VariableSegment(new Variable("variable")));
        });
        it("should parse a variable with a quantifier", () => {
            expectParser(pathSegment(), "/:variable+", new VariableSegment(new Variable("variable"), { quantifier: new Quantifier("+") }));
        });
        it("should parse a variable with a pattern", () => {
            expectParser(pathSegment(), "/:variable(.*)", new VariableSegment(new Variable("variable"), { pattern: new Pattern(".*") }));
        });
        it("should parse a complex segment", () => {
            const expected = new ComplexSegment([new StringSegment("test-"), new VariableSegment(new Variable("variable"))]);
            expected.segments[1].prefix = undefined;
            expectParser(pathSegment(), "/test-:variable", expected);
        });
        // it("should parse a complex segment (double)", () => {
        //     const expected = [
        //         new StringSegment("test-"),
        //         new VariableSegment(new Variable("variable")),
        //         new StringSegment("-test"),
        //     ];
        //     expected[1].prefix = undefined;
        //     expected[2].prefix = undefined;
        //     expectParser(pathSegment(), "/test-:variable-test", new ComplexSegment(expected));
        // });

        it("should fail to parse an invalid segment", () => {
            const [c, r] = pathSegment()("&something=test", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected character '&', expected '/' at position 0");
        });
    });

    describe("path", () => {
        it("should parse a single slash", () => {
            expectParser(path(), "/", [new StringSegment("")]);
        });
        it("should parse a single segment", () => {
            expectParser(path(), "/test", [new StringSegment("test")]);
        });
        it("should parse multiple segments", () => {
            const expected = [
                new StringSegment("test"),
                new StringSegment("test"),
                new StringSegment("test"),
            ];
            expectParser(path(), "/test/test/test", expected);
        });
        it("should parse string an variable segments intermixed", () => {
            const expected = [
                new StringSegment("test"),
                new VariableSegment(new Variable("variable")),
                new StringSegment("test"),
            ];
            expectParser(path(), "/test/:variable/test", expected);
        });

        it("should fail to parse an empty path", () => {
            const [c, r] = path()("", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected input, expected at least one match at position 0");
        });

        it("should fail to parse an invalid path", () => {
            const [c, r] = path()("test", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected input, expected at least one match at position 0");
        });
    });

    describe("queryParam", () => {
        it("should parse a query parameter", () => {
            expectParser(queryParam(), "??variable=value", new Query("variable", "value"));
        });
        it("should parse a query parameter with a variable", () => {
            expectParser(queryParam(), "??variable=:var", new Query("variable", new Variable("var")));
        });
        it("should parse a query parameter with a variable and a pattern", () => {
            expectParser(queryParam(), "??variable=:var(.*)", new Query("variable", new Variable("var"), new Pattern(".*")));
        });
        it("should fail to parse an invalid query parameter", () => {
            const [c, r] = queryParam()("??variable", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected end of input");
        });
    });

    describe("fullPath", () => {
        it("should parse a full path", () => {
            const expected = new Path([
                new StringSegment("test"),
                new VariableSegment(new Variable("variable")),
                new StringSegment("test"),
            ], [new Query("query", "value")]);
            expectParser(fullPath(), "/test/:variable/test ??query=value", expected);
        });
        it("should parse a full path with a variable pattern", () => {
            const expected = new Path([
                new StringSegment("test"),
                new VariableSegment(new Variable("variable"), { pattern: new Pattern(".*") }),
                new StringSegment("test"),
            ], [new Query("query", "value")]);
            expectParser(fullPath(), "/test/:variable(.*)/test ??query=value", expected);
        });
        it("should parse a full path with a variable query", () => {
            const expected = new Path([
                new StringSegment("test"),
                new VariableSegment(new Variable("variable")),
                new StringSegment("test"),
            ], [new Query("query", new Variable("value"))]);
            expectParser(fullPath(), "/test/:variable/test ??query=:value", expected);
        });
        it("should parse a full path with a variable query and pattern", () => {
            const expected = new Path([
                new StringSegment("test"),
                new VariableSegment(new Variable("variable")),
                new StringSegment("test"),
            ], [new Query("query", new Variable("value"), new Pattern(".*"))]);
            expectParser(fullPath(), "/test/:variable/test ??query=:value(.*)", expected);
        });
        it("should fail to parse an invalid path", () => {
            const [c, r] = fullPath()("", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected input, expected at least one match at position 0");
        });
    });

    describe("assignment", () => {
        it("should parse a simple assignment", () => {
            expectParser(assignment(), ":test <- 123", new Assignment(new Variable("test"), new Number(123)));
        });
        it("should parse a complex assignment", () => {
            expectParser(assignment(), ":test <- concat(123, 456)", new Assignment(
                new Variable("test"),
                new FunctionCall("concat", [new Number(123), new Number(456)])
            ));
        });
        it("should fail to parse an invalid assignment", () => {
            const [c, r] = assignment()("noVar <- 123", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected character 'n', expected ':' at position 0");
        });
    });

    describe("functionCall", () => {
        it("should parse a simple function call", () => {
            expectParser(functionCall(), "concat(123, 456)",
                new FunctionCall("concat", [new Number(123), new Number(456)])
            );
        });
        it("should parse a function call with a variable", () => {
            expectParser(functionCall(), "concat(123, :var)",
                new FunctionCall("concat", [new Number(123), new Variable("var")])
            );
        });
        it("should parse a function call with another function call", () => {
            expectParser(functionCall(), "concat(123, concat(456, 789))",
                new FunctionCall("concat", [
                    new Number(123),
                    new FunctionCall("concat", [new Number(456), new Number(789)])
                ])
            );
        });
        it("should throw an error for an invalid function call", () => {
            const [c, r] = functionCall()("concat(123, 456", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected end of input");
        });
    });

    describe("boolean", () => {
        it("should parse a boolean true", () => {
            expectParser(expression(), "true", new Boolean(true));
        });
        it("should parse a boolean false", () => {
            expectParser(expression(), "false", new Boolean(false));
        });
        it("should fail to parse an invalid boolean", () => {
            const [c, r] = expression()("haha", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("No choice matched");
        });
    });

    describe("expression", () => {
        it("should parse a string literal", () => {
            expectParser(expression(), '"test"', new String("test"));
        });
        it("should parse a number", () => {
            expectParser(expression(), "123", new Number(123));
        });
        it("should parse a boolean", () => {
            expectParser(expression(), "true", new Boolean(true));
        });
        it("should parse a variable", () => {
            expectParser(expression(), ":variable", new Variable("variable"));
        });
        it("should parse a function call", () => {
            expectParser(expression(), "concat(123, 456)", new FunctionCall("concat", [new Number(123), new Number(456)]));
        });
        it("should fail to parse an invalid expression", () => {
            const [c, r] = expression()("nope", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("No choice matched");
        });
    });

    describe("fullExpression", () => {
        it("should parse an assignment", () => {
            expectParser(fullExpression(), ":test <- concat(123, 456)", new Assignment(
                new Variable("test"),
                new FunctionCall("concat", [new Number(123), new Number(456)])
            ));
        });
        it("should parse an expression", () => {
            expectParser(fullExpression(), "concat(123, 456)",
                new FunctionCall("concat", [new Number(123), new Number(456)])
            );
        });

        it("should fail to parse an invalid expression", () => {
            const [c, r] = fullExpression()("nope", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("No choice matched");
        });
    });

    describe("parseUrlRewrite", () => {
        it("should parse a simple redirect", () => {
            const input = "/test/:variable/test ??query=value | /test/:variable/test";
            const expected = new URLRewrite(
                new Path([
                    new StringSegment("test"),
                    new VariableSegment(new Variable("variable")),
                    new StringSegment("test"),
                ], [new Query("query", "value")]),
                new Path([
                    new StringSegment("test"),
                    new VariableSegment(new Variable("variable")),
                    new StringSegment("test"),
                ], []),
                []
            )
            expectParser(parseUrlRewrite(), input, expected);
        });
        it("should parse a redirect with a single expression", () => {
            const input = "/test/:variable/test | concat(123, 456) | /test/:variable/test";
            const expected = new URLRewrite(
                new Path([
                    new StringSegment("test"),
                    new VariableSegment(new Variable("variable")),
                    new StringSegment("test"),
                ], []),
                new Path([
                    new StringSegment("test"),
                    new VariableSegment(new Variable("variable")),
                    new StringSegment("test"),
                ], []),
                [new FunctionCall("concat", [new Number(123), new Number(456)])],
            )
            expectParser(parseUrlRewrite(), input, expected);
        }); 
        it("should parse a redirect with a multiple expressions", () => {
            const input = "/test/:variable/test | concat(123, 456), concat(789, 101112) | /test/:variable/test";
            const expected = new URLRewrite(
                new Path([
                    new StringSegment("test"),
                    new VariableSegment(new Variable("variable")),
                    new StringSegment("test"),
                ], []),
                new Path([
                    new StringSegment("test"),
                    new VariableSegment(new Variable("variable")),
                    new StringSegment("test"),
                ], []),
                [
                    new FunctionCall("concat", [new Number(123), new Number(456)]),
                    new FunctionCall("concat", [new Number(789), new Number(101112)]),
                ],
            )
            expectParser(parseUrlRewrite(), input, expected);
        });
    });
});


function expectParser<T>(parser: Parser<T>, input: string, expected: T) {
    const [c, r] = parser(input, 0);
    expect(c).toEqual(input.length);
    expect(r).toEqual(expected);
}
