# URL Rewrite Language

`url-rewrite-language` is an open-source TypeScript package that provides a robust, fast, and flexible parser and evaluator for a custom language designed to perform URL rewrites. This package allows developers to define and apply complex URL rewriting rules with ease.

## Features
- **Custom Language Syntax:** Define URL rewrite rules using a simple and expressive custom language.
- **Parser and Evaluator:** Includes a parser to interpret the custom language and an evaluator to apply the rewrite rules.
- **Extensible:** Supports a wide range of built-in URL transformations, but is fully extensible to add custom functionalities.
- **Open Source:** Free to use, modify, and distribute under the MIT license.

## Installation
You can install `url-rewrite-language` via npm:

```bash
npm install url-rewrite-language
```

## Usage / Examples
Here's a quick example of how to use `url-rewrite-language`:

```typescript
import { URLRewrite } from 'url-rewrite-language';

// Define your URL rewrite rules
const rules = [
    // Simple rewrite
    URLRewrite.parse("/old/:path+ | /new/:path+"), 
    // Rewrite with query parameter
    URLRewrite.parse("/old/:path+ ??queryParam=:var | /new/:path+/:var"), 
    // Rewrite with custom transformation
    URLRewrite.parse("/old/:path+ | :var <- concat(\"abc\", \"def\") | /new/:path+/:var"), 
]

for (const rule of rules) {
    const result = rule.evaluate("https://example.com/old/hello/world?queryParam=value");
    console.log(result);
}
// Outputs:
// 1: https://example.com/new/hello/world
// 2: https://example.com/new/hello/world/value
// 3: https://example.com/new/hello/world/abcdef
```


### Adding Custom Functions
You can easily add custom functions to the URL rewrite language. Here's an example of how to add a custom `uppercase` function:

```typescript
import { URLRewrite, RewriteEvaluator, Expressions } from 'url-rewrite-language';

const rule = URLRewrite.parse("/old/:path+ | :var <- uppercase(\"hello\") | /new/:path+/:var");
const evaluator = new RewriteEvaluator(rule, {
    uppercase: (str: Expressions.String) => str.toUpperCase()
});

const result = evaluator.evaluate("https://example.com/old/hello/world");
console.log(result);
// Outputs: https://example.com/new/hello/world/HELLO
```
