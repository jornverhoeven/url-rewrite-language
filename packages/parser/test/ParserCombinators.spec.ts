import * as Parser from "../src/ParserCombinators";
import { ParseError } from "../src/ParserError";
import type { Parser as ParserType } from "../src/Parser";

describe("Parser", () => {
    describe("satisfy", () => {
        it("should return a parser that consumes a character and returns it if it satisfies the predicate", () => {
            const parser = Parser.satisfy(c => c === "a", "a");
            expectParser(parser, "a", "a");
        });

        it("should return a parser that consumes a character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.satisfy(c => c === "a", "a");
            expectParserError(parser, "b", "Unexpected character 'b', expected 'a' at position 0");
        });
    });
    describe("anyChar", () => {
        it("should return a parser that consumes a character and returns it", () => {
            const parser = Parser.anyChar();

            for (let i = 0; i < 10; i++) {
                const character = randomAsciiCharacter();
                expectParser(parser, character, character);
            }
        });
    });
    describe("space", () => {
        it("should return a parser that consumes a space character and returns it", () => {
            const parser = Parser.space();
            expectParser(parser, " ", " ");
        });
        it("should return a parser that consumes a space character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.space();
            expectParserError(parser, "a", "Unexpected character 'a', expected 'space' at position 0");
        });
    });
    describe("newLine", () => {
        it("should return a parser that consumes a newline character and returns it", () => {
            const parser = Parser.newLine();
            expectParser(parser, "\n", "\n");
        });
        it("should return a parser that consumes a newline character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.newLine();
            expectParserError(parser, "a", "Unexpected character 'a', expected 'new line' at position 0");
        });
    });
    describe("tab", () => {
        it("should return a parser that consumes a tab character and returns it", () => {
            const parser = Parser.tab();
            expectParser(parser, "\t", "\t");
        });
        it("should return a parser that consumes a tab character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.tab();
            expectParserError(parser, "a", "Unexpected character 'a', expected 'tab' at position 0");
        });
    });
    describe("whitespace", () => {
        it.each([" ", "\t", "\n"])("should return a parser that consumes any whitespace character and returns it", (i) => {
            const parser = Parser.whitespace();
            expectParser(parser, i, i);
        });
        it("should return a parser that consumes any whitespace character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.whitespace();
            expectParserError(parser, "a", "Unexpected character 'a', expected 'whitespace' at position 0");
        });
    });
    describe("char", () => {
        it("should return a parser that consumes a character and returns it", () => {
            const parser = Parser.char("a");
            expectParser(parser, "a", "a");
        });
        it("should return a parser that consumes a character and returns it (20x random)", () => {
            for (let i = 0; i < 20; i++) {
                const character = randomAsciiCharacter();
                const parser = Parser.char(character);
                expectParser(parser, character, character);
            }
        });
        it("should return a parser that consumes a character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.char("a");
            expectParserError(parser, "b", "Unexpected character 'b', expected 'a' at position 0");
        });
    });
    describe("digit", () => {
        it("should return a parser that consumes a digit character and returns it (0-9)", () => {
            for (let i = 0; i < 10; i++) {
                const parser = Parser.digit();
                expectParser(parser, i.toString(), i.toString());
            }
        });
        it("should return a parser that consumes a digit character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.digit();
            expectParserError(parser, "a", "Unexpected character 'a', expected 'any digit' at position 0");
        });
    });
    describe("letter", () => {
        it("should return a parser that consumes a letter character and returns it (a-z, A-Z)", () => {
            for (let i = 0; i < 26; i++) {
                const parser = Parser.letter();
                expectParser(parser, String.fromCharCode(97 + i), String.fromCharCode(97 + i));
                expectParser(parser, String.fromCharCode(65 + i), String.fromCharCode(65 + i));
            }
        });
        it("should return a parser that consumes a letter character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.letter();
            expectParserError(parser, "0", "Unexpected character '0', expected 'any letter' at position 0");
        });
    });
    describe("upper", () => {
        it("should return a parser that consumes an uppercase letter character and returns it (A-Z)", () => {
            for (let i = 0; i < 26; i++) {
                const parser = Parser.upper();
                expectParser(parser, String.fromCharCode(65 + i), String.fromCharCode(65 + i));
            }
        });
        it("should return a parser that consumes an uppercase letter character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.upper();
            expectParserError(parser, "a", "Unexpected character 'a', expected 'any uppercase letter' at position 0");
        });
    });
    describe("lower", () => {
        it("should return a parser that consumes a lowercase letter character and returns it (a-z)", () => {
            for (let i = 0; i < 26; i++) {
                const parser = Parser.lower();
                expectParser(parser, String.fromCharCode(97 + i), String.fromCharCode(97 + i));
            }
        });
        it("should return a parser that consumes a lowercase letter character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.lower();
            expectParserError(parser, "A", "Unexpected character 'A', expected 'any lowercase letter' at position 0");
        });
    });
    describe("alphaNum", () => {
        it("should return a parser that consumes an alphanumeric character and returns it (a-z, A-Z, 0-9)", () => {
            for (let i = 0; i < 26; i++) {
                const parser = Parser.alphaNum();
                expectParser(parser, String.fromCharCode(97 + i), String.fromCharCode(97 + i));
                expectParser(parser, String.fromCharCode(65 + i), String.fromCharCode(65 + i));
            }
            for (let i = 0; i < 10; i++) {
                const parser = Parser.alphaNum();
                expectParser(parser, i.toString(), i.toString());
            }
        });
        it("should return a parser that consumes an alphanumeric character and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.alphaNum();
            expectParserError(parser, "!", "Unexpected character '!', expected 'any alphanumeric character' at position 0");
        });
    });
    describe("oneOf", () => {
        it("should return a parser that consumes a character and returns it if it is in the list of characters", () => {
            const parser = Parser.oneOf("abc");
            expectParser(parser, "a", "a");
            expectParser(parser, "b", "b");
            expectParser(parser, "c", "c");
        });
        it("should return a parser that consumes a character and returns a ParseError if it is not in the list of characters", () => {
            const parser = Parser.oneOf("abc");
            expectParserError(parser, "d", "Unexpected character 'd', expected 'one of abc' at position 0");
        });
    });
    describe("noneOf", () => {
        it("should return a parser that consumes a character and returns it if it is not in the list of characters", () => {
            const parser = Parser.noneOf("abc");
            expectParser(parser, "d", "d");
        });
        it("should return a parser that consumes a character and returns a ParseError if it is in the list of characters", () => {
            const parser = Parser.noneOf("abc");
            expectParserError(parser, "a", "Unexpected character 'a', expected 'none of abc' at position 0");
        });
    });
    describe("many", () => {
        it("should return a parser that consumes zero characters and returns an empty array", () => {
            const parser = Parser.many(Parser.digit());
            const [c, r] = parser("", 0);
            expect(c).toEqual(0);
            expect(r).toEqual([]);
        });
        it("should return a parser that consumes more than one character and returns an array of characters", () => {
            const parser = Parser.many(Parser.digit());
            const [c, r] = parser("123", 0);
            expect(c).toEqual(3);
            expect(r).toEqual(["1", "2", "3"]);
        });
    });
    describe("many1", () => {
        it("should return a parser that consumes one or more characters and returns an array of characters", () => {
            const parser = Parser.many1(Parser.digit());
            const [c, r] = parser("123", 0);
            expect(c).toEqual(3);
            expect(r).toEqual(["1", "2", "3"]);
        });
        it("should throw an error if the parser consumes zero characters", () => {
            const parser = Parser.many1(Parser.digit());
            const [c, r] = parser("", 0);
            expect(c).toEqual(0);
            expect(r).toBeInstanceOf(ParseError);
            expect((r as ParseError).message).toEqual("Unexpected input, expected at least one match at position 0");
        });
    });
    describe("skip", () => {
        it("should return a parser that consumes a character and returns undefined", () => {
            const parser = Parser.skip(Parser.digit());
            const [c, r] = parser("1", 0);
            expect(c).toEqual(1);
            expect(r).toBeUndefined();
        });
    });
    describe("skipMany", () => { 
        it("should return a parser that consumes zero or more characters and returns undefined", () => {
            const parser = Parser.skipMany(Parser.digit());
            const [c, r] = parser("123", 0);
            expect(c).toEqual(3);
            expect(r).toBeUndefined();
        });
    });
    describe("string", () => { 
        it("should return a parser that consumes a string and returns it", () => {
            const parser = Parser.string("abc");
            expectParser(parser, "abc", "abc");
        });
        it("should return a parser that consumes a string and returns a ParseError if it does not satisfy the predicate", () => {
            const parser = Parser.string("abc");
            expectParserError(parser, "def", "Unexpected character 'd', expected 'abc' at position 0");
        });
    });
    describe("spaces", () => { 
        it("should return a parser that consumes zero or more whitespace characters and returns them", () => {
            const parser = Parser.spaces();
            expectParser(parser, "   ", "   ");
        });
        it("should return a parser that consumes zero or more whitespace characters and returns them (random)", () => {
            const whitespaceChars = " \t\n";
            const input = Array.from({ length: 10 }, () => whitespaceChars[Math.floor(Math.random() * whitespaceChars.length)]).join("");
            const parser = Parser.spaces();
            expectParser(parser, input, input);
        });
        it("should return a parser that consumes zero or more whitespace characters and returns an empty string if no whitespace's are found", () => {
            const parser = Parser.spaces();
            const [c, r] = parser("abc", 0);
            expect(c).toEqual(0);
            expect(r).toEqual("");
        });
    });

    describe("map", () => {});
    describe("chain", () => {});
    describe("sequence", () => {});
    describe("choice", () => {});
    describe("optional", () => {});
    describe("between", () => {});
    describe("separatedBy", () => {});

    describe("number", () => {});
    describe("word", () => {});
    describe("stringLiteral", () => {});
    
});

function expectParser(parser: ParserType<any>, input: string, expected: any) {
    const [c, r] = parser(input, 0);
    expect(c).toBe(input.length);
    expect(r).toBe(expected);
}
function expectParserError(parser: ParserType<any>, input: string, message: string) {
    const [c, r] = parser(input, 0);
    expect(c).toBe(0);
    expect(r).toBeInstanceOf(ParseError);
    expect(r.message).toBe(message);
}
function randomAsciiCharacter() {
    return String.fromCharCode(33 + Math.floor(Math.random() * 93));
}
