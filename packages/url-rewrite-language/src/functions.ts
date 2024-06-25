import { Primitive, String } from "./Expressions";

export function concat(...args: Primitive<unknown>[]): String {
    if (args.length < 2) throw new Error("concat requires at least two arguments");
    return new String(args.map(arg => arg.toString()).join(""));
}

