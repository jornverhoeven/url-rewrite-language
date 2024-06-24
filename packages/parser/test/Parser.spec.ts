import { parseWithEof, parseWithLeftovers, regularParse } from "../src/Parser";
import { char, digit, string, word } from "../src/ParserCombinators";

describe("Parser", () => {
    describe.each([
        ["char()", char('c'), "c", "c"],
        ["digit()", digit(), "1", "1"],
        ["string()", string("hello"), "hello", "hello"],
    ])("regularParse %s", (_, p, i, e) => {
        it("should run a parser on an input string", () => {
            expect(regularParse(p, i)).toEqual(e);
        });
        it("should throw an error if the parser does not consume the full input", () => {
            expect(() => regularParse(p, i + " a")).toThrow();
        });
    });
    describe.each([
        ["char()", char('c'), "c", "c"],
        ["digit()", digit(), "1", "1"],
        ["string()", string("hello"), "hello", "hello"],
    ])("parseWithEof %s", (_, p, i, e) => { 
        it("should run a parser on an input string", () => {
            expect(parseWithEof(p, i)).toEqual(e);
        });
        it("should throw an error if the parser does not consume the full input", () => {
            expect(() => parseWithEof(p, i + " a")).toThrow();
        });
    });
    describe.each([
        ["char()", char('c'), "c", "c"],
        ["digit()", digit(), "1", "1"],
        ["string()", string("hello"), "hello", "hello"],
    ])("parseWithLeftovers %s", (_, p, i, e) => {
        it("should run a parser on an input string", () => {
            expect(parseWithLeftovers(p, i)).toEqual([e, ""]);
        });
        it("should throw an error if the parser fails on the input", () => {
            expect(() => parseWithLeftovers(p, "a " + i)).toThrow();
        });
        it("should return the leftover string if the parser completes", () => {
            expect(parseWithLeftovers(p, i + " a")).toEqual([e, " a"]);
        });
    });
});
