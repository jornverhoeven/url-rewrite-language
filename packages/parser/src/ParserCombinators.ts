import { Parser } from "./Parser";
import { eof, unexpected, ParseError, unexpectedString } from "./ParserError";

export function satisfy(predicate: (c: string, p: string) => boolean, expected?: string): Parser<string> {
    return (input, current) => {
        if (current >= input.length) return [current, eof(current, input.length)];
        const c = input[current];
        if (predicate(c, input[current - 1])) return [current + 1, c];
        return [current, unexpected(c, current, expected)];
    };
}

export function anyChar(): Parser<string> {
    return satisfy(() => true);
}
export function space(): Parser<string> {
    return satisfy(c => c === " ", "space");
}
export function newLine(): Parser<string> {
    return satisfy(c => c === "\n", "new line");
}
export function tab(): Parser<string> {
    return satisfy(c => c === "\t", "tab");
}
export function whitespace(): Parser<string> {
    return satisfy(c => [" ", "\t", "\n"].includes(c), "whitespace");
}
export function char(c: string): Parser<string> {
    return satisfy(_c => _c === c, c);
}
export function digit(): Parser<string> {
    return satisfy(c => c >= "0" && c <= "9", "any digit");
}
export function letter(): Parser<string> {
    return satisfy(c => c >= "a" && c <= "z" || c >= "A" && c <= "Z", "any letter");
}
export function upper(): Parser<string> {
    return satisfy(c => c >= "A" && c <= "Z", "any uppercase letter");
}
export function lower(): Parser<string> {
    return satisfy(c => c >= "a" && c <= "z", "any lowercase letter");
}
export function alphaNum(): Parser<string> {
    return satisfy(c => c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9", "any alphanumeric character");
}

export function oneOf(chars: string): Parser<string> {
    return satisfy(c => chars.includes(c), `one of ${chars}`);
}
export function noneOf(chars: string): Parser<string> {
    return satisfy(c => !chars.includes(c), `none of ${chars}`);
}
export function many<T>(parser: Parser<T>): Parser<T[]> {
    return (input, current) => {
        let c = current;
        let r: T[] = [];
        while (true) {
            const [c_, r_] = parser(input, c);
            if (r_ instanceof ParseError || c_ === c) return [c, r];
            r.push(r_);
            c = c_;
        }
    };
}
export function many1<T>(parser: Parser<T>): Parser<T[]> {
    return (input, current) => {
        const [c, r] = parser(input, current);
        if (r instanceof ParseError && c === current) return [0, new ParseError(`Unexpected input, expected at least one match at position ${current}`, current)];
        if (r instanceof ParseError) return [c, r];
        const [c_, r_] = many(parser)(input, c) as [number, T[]];
        return [c_, [r, ...r_]];
    };
}
export function skip(parser: Parser<any>): Parser<undefined> {
    return (input, current) => {
        const [c, r] = parser(input, current);
        if (r instanceof ParseError) return [c, r];
        return [c, undefined];
    };
}
export function skipMany(parser: Parser<any>): Parser<undefined> {
    return (input, current) => {
        let c = current;
        let r;
        while (true) {
            [c, r] = parser(input, c);
            if (r instanceof ParseError) return [c, undefined];
        }
    };
}

export function string(str: string): Parser<string> {
    return (input, current) => {
        let i = 0;
        while (i < str.length) {
            if (current + i >= input.length) return [current + i, eof(current + i, input.length)];
            if (input[current + i] !== str[i]) return [current + i, unexpectedString(input[current + i], current + i, str)];
            i++;
        }
        return [current + i, str];
    };
}
export function spaces(): Parser<string> {
    return (input, current) => {
        const [c, r] = many(whitespace())(input, current);
        if (r instanceof ParseError) return [c, r];
        return [c, r.join("")];
    };
}

export function map<T, U>(parser: Parser<T>, f: (t: T) => U): Parser<U> {
    return (input, current) => {
        const [c, r] = parser(input, current);
        if (r instanceof ParseError) return [current, r];
        return [c, f(r)];
    };
}
export function chain<T, U>(parser: Parser<T>, f: (t: T) => Parser<U>): Parser<U> {
    return (input, current) => {
        const [c, r] = parser(input, current);
        if (r instanceof ParseError) return [c, r];
        return f(r)(input, c);
    };
}
type Sequence<P extends Parser<unknown>[]> = {
    -readonly [K in keyof P]: NonNullable<ReturnType<P[K]>[1]>;
};
export function sequence<P extends Parser<unknown>[]>(...parsers: P): Parser<Sequence<P>> {
    return (input, current) => {
        let c = current;
        let r = [] as any[];
        for (const parser of parsers) {
            const [c_, r_] = parser(input, c);
            if (r_ instanceof ParseError) return [c, r_];
            r.push(r_);
            c = c_;
        }
        return [c, r as Sequence<P>];
    };
}
export function choice<T>(...parsers: Parser<T>[]): Parser<T> {
    return (input, current) => {
        for (const parser of parsers) {
            const [c, r] = parser(input, current);
            if (!(r instanceof ParseError)) return [c, r as T];
        }
        return [current, new ParseError("No choice matched", current)];
    };
}
export function optional<T>(parser: Parser<T>): Parser<T | undefined> {
    return (input, current) => {
        const [c, r] = parser(input, current);
        if (r instanceof ParseError) return [current, undefined];
        return [c, r];
    };
}
export function between<T, S = any, E = any>(parser: Parser<T>, start: Parser<S>, end: Parser<E>): Parser<T> {
    return map(sequence(start, parser, end), r => r[1] as T);
}
export function separatedBy<T, S>(parser: Parser<T>, separator: Parser<S>): Parser<T[]> {
    return (input, current) => {
        let c = current;
        let r: T[] = [];
        while (true) {
            const [c_, r_] = parser(input, c);
            if (r_ instanceof ParseError) return [c, r];
            r.push(r_);
            const [c__, _] = separator(input, c_);
            if (r_ instanceof ParseError) return [c, r];
            c = c__;
        }
    };
}

export function number(): Parser<number> {
    return map(many1(digit()), r => parseInt(r.join("")));
}

export function word(): Parser<string> {
    return map(sequence(letter(), restOfWord()), r => r.join(""));

    function restOfWord(): Parser<string> {
        return map(many(alphaNum()), r => r.join(""));
    }
}
export function stringLiteral(): Parser<string> {
    return between(map(many(satisfy((c, prev) => c !== "\"" || (c === "\"" && prev === "\\"))), r => r.join("")), char("\""), char("\""));
}
