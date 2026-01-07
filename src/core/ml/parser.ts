export type Parser<T> = (input: string) => ParseResult<T>;

export type ParseResult<T> =
  | { success: true; value: T; remaining: string }
  | { success: false; error: string };

export function success<T>(value: T, remaining: string): ParseResult<T> {
  return { success: true, value, remaining };
}

export function failure<T>(error: string): ParseResult<T> {
  return { success: false, error };
}

// basic parsers

/// take expected string if available
export function consume(expected: string): Parser<string> {
  return (input: string) => {
    if (input.startsWith(expected)) {
      return success(expected, input.slice(expected.length));
    }
    return failure(`Expected "${expected}"`);
  };
}

/// any amount of whitespace
export function ws(): Parser<string> {
  return (input: string) => {
    let res = "";
    let current = input;
    while (current.length > 0 && /\s/.test(current[0])) {
      res += current[0];
      current = current.slice(1);
    }
    return success(res, current);
  };
}

/// takes until a predicate is true
export function takeUntil(pred: (char: string) => boolean): Parser<string> {
  return (input: string) => {
    let res = "";
    let current = input;
    while (current.length > 0 && !pred(current[0])) {
      res += current[0];
      current = current.slice(1);
    }
    console.log(res);
    return success(res, current);
  };
}

/// takes 1 or more chars until a predicate is true
export function take1Until(pred: (char: string) => boolean): Parser<string> {
  return (input: string) => {
    let res = "";
    let current = input;
    do {
      res += current[0];
      current = current.slice(1);
    } while (current.length > 0 && !pred(current[0]));
    console.log(res);
    return success(res, current);
  };
}

/// eof
export function eof(): Parser<null> {
  return (input: string) => {
    if (input.length === 0) {
      return success(null, "");
    }
    return failure("Expected end of input");
  };
}

/// sequence of 1 or more alphanumeric chars
export function alphanumeric1(): Parser<string> {
  return (input: string) => {
    let res = "";
    let current = input;

    while (current.length > 0 && /[a-zA-Z0-9]/.test(current[0])) {
      res += current[0];
      current = current.slice(1);
    }

    if (res.length === 0) {
      return failure("Expected at least one alphanumeric character");
    }

    return success(res, current);
  };
}

export function anyChar(): Parser<string> {
  return (input: string) => {
    if (input.length === 0) {
      return failure("Unexpected end of input");
    }
    return success(input[0], input.slice(1));
  };
}

// ccombinators

export function seq<T extends any[]>(
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
  return (input: string) => {
    const results: any[] = [];
    let current = input;

    for (const parser of parsers) {
      const result = parser(current);
      if (!result.success) {
        return result as ParseResult<T>;
      }
      results.push(result.value);
      current = result.remaining;
    }

    return success(results as T, current);
  };
}

/// parse something between two parsers
export function between<A, B, C>(
  open: Parser<A>,
  content: Parser<B>,
  close: Parser<C>,
): Parser<B> {
  return map(seq(open, content, close), ([, value]) => value);
}

export function choice<T>(...parsers: Parser<T>[]): Parser<T> {
  return (input: string) => {
    for (const parser of parsers) {
      const result = parser(input);
      if (result.success) {
        return result;
      }
    }
    return failure("All choices failed");
  };
}

/// transform the result of a parser
export function map<T, U>(parser: Parser<T>, fn: (value: T) => U): Parser<U> {
  return (input: string) => {
    const result = parser(input);
    if (!result.success) {
      return result;
    }
    return success(fn(result.value), result.remaining);
  };
}

/// parse if possible, otherwise return null
export function optional<T>(parser: Parser<T>): Parser<T | null> {
  return (input: string) => {
    const result = parser(input);
    if (result.success) {
      return result;
    }
    return success(null, input);
  };
}

/// parse zero or more times
export function many<T>(parser: Parser<T>): Parser<T[]> {
  return (input: string) => {
    const results: T[] = [];
    let current = input;

    while (true) {
      const result = parser(current);
      if (!result.success) {
        break;
      }
      results.push(result.value);
      current = result.remaining;
    }

    return success(results, current);
  };
}

/// parse one or more times
export function many1<T>(parser: Parser<T>): Parser<T[]> {
  return (input: string) => {
    const result = parser(input);
    if (!result.success) {
      return result;
    }

    const restResult = many(parser)(result.remaining);
    if (!restResult.success) {
      return restResult;
    }

    return success([result.value, ...restResult.value], restResult.remaining);
  };
}

/// parse until a terminator is met
export function manyUntil<T>(
  parser: Parser<T>,
  terminator: Parser<any>,
): Parser<T[]> {
  return (input: string) => {
    const results: T[] = [];
    let current = input;

    while (true) {
      const termCheck = lookahead(terminator)(current);
      if (termCheck.success) {
        break;
      }

      const result = parser(current);
      if (!result.success) {
        return result;
      }

      if (current.length === 0) {
        return failure("Reached EOF before terminator");
      }

      // guard against infinite loops
      if (result.remaining.length === current.length) {
        return failure("Parser stuck: Child parser did not consume any input");
      }

      results.push(result.value);
      current = result.remaining;
    }

    return success(results, current);
  };
}

/// check if parser succeeds without consuming input
export function lookahead<T>(parser: Parser<T>): Parser<T> {
  return (input: string) => {
    const result = parser(input);
    if (!result.success) {
      return result;
    }

    return success(result.value, input);
  };
}

/// succeed only if parser fails (negative lookahead)
export function not<T>(parser: Parser<T>): Parser<null> {
  return (input: string) => {
    const result = parser(input);
    if (result.success) {
      return failure("Expected parser to fail");
    }
    return success(null, input);
  };
}
