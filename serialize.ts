// deno-lint-ignore-file no-explicit-any

import type { ConstructType } from "./types.ts";

const stringify = JSON.stringify;

export type Reducer<T> = [name: string, reduceHandle?: (value: T) => unknown[]];

const builtInReducers = new Map<ConstructType<unknown>, Reducer<any>>(
  [
    [Date, ["Date", (value: Date) => [value.getTime()]]],
    [RegExp, [
      "RegExp",
      (value: RegExp) => value.flags ? [value.source, value.flags] : [value.source],
    ]],
    [Set, ["Set", (value: Set<unknown>) => [...value]]],
    [Map, ["Map", (value: Map<unknown, unknown>) => [...value.entries()]]],
  ],
);

export function serialize(
  input: unknown,
  reducers = new Map<ConstructType<unknown>, Reducer<any>>(),
): string {
  const counters = new Map<unknown, number>();
  const reduced = new Map<unknown, [name: string, args: unknown[]]>();

  const refs = [input] as unknown[];
  const indexes = new Map<unknown, number>([[input, 0]]);

  let result = "";

  traverseCount(input);

  result += "[";
  traverseValue(refs[0], true);
  for (let i = 1; i < refs.length; i++) {
    result += ",";
    traverseValue(refs[i], true);
  }
  result += "]";
  return result;

  function traverseCount(value: unknown): void {
    switch (value) {
      case undefined:
      case null:
      case true:
      case false:
        return;
    }
    const typeValue = typeof value;
    switch (typeValue) {
      case "number":
      case "bigint":
      case "string": {
        return;
      }
    }
    const counter = (counters.get(value) ?? 0) + 1;
    counters.set(value, counter);
    if (counter > 1) {
      return;
    }
    switch (typeValue) {
      case "symbol":
        return;
    }
    if (Array.isArray(value)) {
      value.forEach(traverseCount);
      return;
    }
    const ctor = (value as any).constructor;
    const reducer = reducers.get(ctor) ?? builtInReducers.get(ctor);
    if (reducer) {
      const name = reducer[0];
      const args = reducer[1]?.(value) ?? [];
      reduced.set(value, [name, args]);
      args.forEach(traverseCount);
      return;
    }
    Object.values(value as object).forEach(traverseCount);
  }

  function traverseValue(value: unknown, root?: boolean): void {
    switch (value) {
      case undefined: {
        result += "[1]";
        return;
      }
      case null:
      case true:
      case false: {
        result += value;
        return;
      }
    }
    const typeValue = typeof value;
    switch (typeValue) {
      case "number": {
        if (Number.isNaN(value)) {
          result += "[2]";
          return;
        }
        if (!Number.isFinite(value)) {
          result += (value as number) > 0 ? "[3]" : "[4]";
          return;
        }
        if (value === 0 && 1 / value < 0) {
          result += "[5]";
          return;
        }
        result += value;
        return;
      }
      case "bigint": {
        result += `["BigInt","${value}"]`;
        return;
      }
      case "string": {
        result += stringify(value);
        return;
      }
    }
    const counter = counters.get(value) ?? 0;
    if (counter === 0) {
      throw new Error("??");
    }
    if (counter === 1 || root) {
      switch (typeValue) {
        case "symbol": {
          result += Symbol.keyFor(value as symbol)
            ? `["Symbol",${stringify((value as symbol).description)}]`
            : '["Symbol"]';
          return;
        }
      }
      if (Array.isArray(value)) {
        result += "[[";
        const arrayLength = value.length;
        if (arrayLength > 0) {
          traverseValue(value[0]);
          for (const v of value.slice(1)) {
            result += ",";
            traverseValue(v);
          }
        }
        result += "]]";
        return;
      }
      const reducer = reduced.get(value);
      if (reducer) {
        result += `[${stringify(reducer[0])}`;
        for (const arg of reducer[1]) {
          result += ",";
          traverseValue(arg);
        }
        result += "]";
        return;
      }
      result += "{";
      const objectEntries = Object.entries(value as object);
      const objectLength = objectEntries.length;
      if (objectLength > 0) {
        result += `${stringify(objectEntries[0][0])}:`;
        traverseValue(objectEntries[0][1]);
        for (const [k, v] of objectEntries.slice(1)) {
          result += `,${stringify(k)}:`;
          traverseValue(v);
        }
      }
      result += "}";
      return;
    }
    let idx = indexes.get(value);
    if (typeof idx !== "number") {
      indexes.set(value, idx = refs.length);
      refs.push(value);
    }
    result += `[0,${idx}]`;
  }
}
