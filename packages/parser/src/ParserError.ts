
export class ParseError extends Error {
    constructor(public message: string, public position: number) {
        super(message);
    }
}
export function printErrorMessage(input: string, error: ParseError) {
    const position = error.position;
    const line = input.split("\n")[0];
    const pointer = " ".repeat(position) + "^--- ParseError: ";
    return `${line}\n${pointer}${error.message}`;
}
export function eof(current: number, length: number) { return new ParseError(`Unexpected end of input`, current); }
export function eop(current: number) { return new ParseError(`Unexpected end of parser after ${current} characters`, current); }
export function unexpected(c: string, current: number, expected?: string) {
    if (expected) return new ParseError(`Unexpected character '${c}', expected '${expected}' at position ${current}`, current);
    return new ParseError(`Unexpected character '${c}' at position ${current}`, current);
}
export function unexpectedString(c: string, current: number, expected: string) {
    return new ParseError(`Unexpected character '${c}', expected '${expected}' at position ${current}`, current);
}
