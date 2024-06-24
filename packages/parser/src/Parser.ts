import { ParseError, eop } from "./ParserError";

export type Parser<T> = (input: string, current: number) => [number, ParserResult<T>];
export type ParserResult<T> = T | ParseError;

/**
 * Applies a parser to an input string. 
 * Only if the full input is parsed properly will the parser return, otherwise an error is thrown
 * 
 * @example
 * regularParse(char('c'), "c");    // Outputs "c"
 * regularParse(char('c'), "abc");  // Throws an error
 * regularParse(char('c'), "cab");  // Throws an error
 * 
 * @param parser The parser to use
 * @param input The input to parse
 * @returns The output of the parser
 */
export function regularParse<T>(parser: Parser<T>, input: string): T {
    return parseWithEof(parser, input) as T;
}
/**
 * Applies a parser to an input string. 
 * Only if the full input is parsed properly will the parser return, otherwise an error is thrown
 * 
 * @example
 * parseWithEof(char('c'), "c");    // Outputs "c"
 * parseWithEof(char('c'), "abc");  // Throws an error
 * parseWithEof(char('c'), "cab");  // Throws an error
 * 
 * @param parser The parser to use
 * @param input The input to parse
 * @returns The output of the parser
 */
export function parseWithEof<T>(parser: Parser<T>, input: string): T {
    const [c, r] = parser(input, 0);
    if (c === input.length) {
        if (r instanceof ParseError) throw r;
        return r;
    }
    throw eop(c);
}
/**
 * Applies a parser to an input string.
 * It will consume as much as possible with the parser, and return both the parser 
 * output and the string that is left-over.
 * 
 * @example
 * parseWithLeftovers(char('a'), "a");      // Returns ["a", ""]
 * parseWithLeftovers(char('a'), "abc");    // Returns ["a", "bc"]
 * parseWithLeftovers(char('b'), "abc");    // Throws a ParserError
 * 
 * @param parser The parser to use
 * @param input The input to parse
 * @returns The output of the parser
 */
export function parseWithLeftovers<T>(parser: Parser<T>, input: string): ParserResult<[T, string]> {
    const [c, r] = parser(input, 0);
    if (r instanceof ParseError) throw r;
    return [r, input.slice(c)];
}
