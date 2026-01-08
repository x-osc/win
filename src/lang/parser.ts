export type Parser<T> = (input: string, offset: number) => ParseResult<T>;

export type ParseResult<T> = ParseSuccess<T> | ParseFaliure;

export type ParseSuccess<T> = { success: true; value: T; offset: number };
export type ParseFaliure = {
  success: false;
  reason: string;
  offset: number;
  loc: SourceLocation;
};

export function success<T>(value: T, offset: number): ParseResult<T> {
  return { success: true, value, offset };
}

// start and end are backward !!! be warned !!!
export function failure<T>(
  error: string,
  endOffset: number,
  startOffset?: number,
): ParseResult<T> {
  return {
    success: false,
    reason: error,
    offset: endOffset,
    loc: { start: startOffset ?? endOffset, end: endOffset },
  };
}

// location stuffs

export type SourceLocation = {
  start: number;
  end: number;
};

export interface Located<T> {
  value: T;
  loc: SourceLocation;
}

export function located<T>(parser: Parser<T>): Parser<Located<T>> {
  return (input, offset) => {
    const start = offset;
    const result = parser(input, offset);

    if (!result.success) return result;

    let val: Located<T> = {
      value: result.value,
      loc: {
        start: start,
        end: result.offset,
      },
    };

    return success(val, result.offset);
  };
}

export function unwraploc<T>(loc: Located<T>): T {
  return loc.value;
}

// basic parsers

/// take expected string if available
export function consume(expected: string): Parser<string> {
  return (input, offset) => {
    if (input.startsWith(expected, offset)) {
      return success(expected, offset + expected.length);
    }
    return failure(`Expected "${expected}"`, offset);
  };
}

/// any amount of whitespace
export function ws(): Parser<string> {
  return (input: string, offset: number) => {
    let current = offset;
    while (current < input.length && /\s/.test(input[current])) {
      current++;
    }
    return success(input.slice(offset, current), current);
  };
}

/// takes until a predicate is true
export function takeUntil(pred: (char: string) => boolean): Parser<string> {
  return (input, offset) => {
    let current = offset;
    while (current < input.length && !pred(input[current])) {
      current++;
    }
    return success(input.slice(offset, current), current);
  };
}

/// takes 1 or more chars until a predicate is true
export function take1Until(pred: (char: string) => boolean): Parser<string> {
  return (input, offset) => {
    if (offset >= input.length) return failure("Unexpected EOF", offset);

    if (pred(input[offset])) {
      return failure("Predicate matched immediately; nothing to take", offset);
    }

    let current = offset;
    current++;

    while (current < input.length && !pred(input[current])) {
      current++;
    }

    return success(input.slice(offset, current), current);
  };
}

/// eof
export function eof(): Parser<null> {
  return (input, offset) => {
    if (offset >= input.length) return success(null, offset);
    return failure("Expected end of input", offset);
  };
}

/// sequence of 1 or more alphanumeric chars
export function alphanumeric1(): Parser<string> {
  return (input, offset) => {
    let start = offset;
    while (offset < input.length && /[a-zA-Z0-9]/.test(input[offset])) {
      offset++;
    }
    if (start === offset) {
      return failure("Expected alphanumeric character", start);
    }
    return success(input.slice(start, offset), offset);
  };
}

export function anyChar(): Parser<string> {
  return (input, offset) => {
    const char = input[offset];
    if (char === undefined) {
      return failure("Unexpected EOF", offset);
    }
    return success(char, offset + 1);
  };
}

// ccombinators

export function seq<T extends any[]>(
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
  return (input, offset) => {
    const results: any[] = [];
    let currentOffset = offset;

    for (const parser of parsers) {
      const result = parser(input, currentOffset);
      if (!result.success) {
        return result;
      }
      results.push(result.value);
      currentOffset = result.offset;
    }

    return success(results as T, currentOffset);
  };
}

export function choice<T>(...parsers: Parser<T>[]): Parser<T> {
  return (input, offset) => {
    let bestError: ParseResult<T> | null = null;

    for (const parser of parsers) {
      const result = parser(input, offset);
      if (result.success) return result;

      // remember the error that got furthest
      if (!bestError || result.loc.end > bestError.loc.end) {
        bestError = result;
      }
    }
    return bestError || failure("No choices matched", offset);
  };
}

/// transform the result of a parser
export function map<T, U>(parser: Parser<T>, fn: (value: T) => U): Parser<U> {
  return (input, offset) => {
    const result = parser(input, offset);
    if (!result.success) {
      return result;
    }
    return success(fn(result.value), result.offset);
  };
}

/// parse if possible, otherwise return null
export function optional<T>(parser: Parser<T>): Parser<T | null> {
  return (input, offset) => {
    const result = parser(input, offset);
    if (result.success) {
      return result;
    }
    return success(null, offset);
  };
}

/// parse zero or more times
export function many<T>(parser: Parser<T>): Parser<T[]> {
  return (input, offset) => {
    const results: T[] = [];
    let currentOffset = offset;

    while (true) {
      const result = parser(input, currentOffset);
      if (!result.success) break;

      // guard against infinite loops
      if (result.offset === currentOffset) break;

      results.push(result.value);
      currentOffset = result.offset;
    }

    return success(results, currentOffset);
  };
}

/// parse one or more times
export function many1<T>(parser: Parser<T>): Parser<T[]> {
  return (input, offset) => {
    const firstResult = parser(input, offset);

    if (!firstResult.success) {
      return firstResult;
    }

    const restResult = many(parser)(input, firstResult.offset);
    if (!restResult.success) {
      return restResult;
    }

    return success([firstResult.value, ...restResult.value], restResult.offset);
  };
}

/// parse until a terminator is met
export function manyUntil<T>(
  parser: Parser<T>,
  terminator: Parser<any>,
): Parser<T[]> {
  return (input, offset) => {
    const results: T[] = [];
    let currentOffset = offset;

    while (true) {
      const termCheck = terminator(input, currentOffset);
      if (termCheck.success) break;

      if (currentOffset >= input.length) {
        return failure("Reached EOF before terminator", currentOffset);
      }

      const result = parser(input, currentOffset);
      if (!result.success) return result;

      if (result.offset === currentOffset) {
        return failure(
          "Parser stuck: child parser did not consume any input",
          currentOffset,
        );
      }

      results.push(result.value);
      currentOffset = result.offset;
    }

    return success(results, currentOffset);
  };
}

/// check if parser succeeds without consuming input
export function lookahead<T>(parser: Parser<T>): Parser<T> {
  return (input, offset) => {
    const result = parser(input, offset);
    if (!result.success) return result;
    return success(result.value, offset);
  };
}

/// succeed only if parser fails (negative lookahead)
export function not<T>(parser: Parser<T>): Parser<null> {
  return (input, offset) => {
    const result = parser(input, offset);
    if (result.success) return failure("Expected parser to fail", offset);
    return success(null, offset);
  };
}

/// uses custom error message instead of default one
export function expect<T>(
  parser: Parser<T>,
  errorMessage: string,
  createSpan = true,
): Parser<T> {
  return (input, offset) => {
    const result = parser(input, offset);
    if (result.success) return result;
    if (createSpan) {
      // return error from start to end
      return failure(errorMessage, offset, result.loc.start);
    } else {
      return failure(errorMessage, offset);
    }
  };
}
