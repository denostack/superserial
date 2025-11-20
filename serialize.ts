// deno-lint-ignore-file no-explicit-any

import type { ConstructType } from "./types.ts";

const stringify = JSON.stringify;

export type Reducer<T> = [name: string, serialize?: (value: T) => unknown[]];

export const builtInReducers = new Map<ConstructType<unknown>, Reducer<any>>(
  [
    [Date, ["Date", (value: Date) => [value.getTime()]]],
    [RegExp, [
      "RegExp",
      (value: RegExp) =>
        value.flags ? [value.source, value.flags] : [value.source],
    ]],
    [Set, ["Set", (value: Set<unknown>) => [...value]]],
    [Map, ["Map", (value: Map<unknown, unknown>) => [...value.entries()]]],
  ],
);

export function serialize(
  input: unknown,
  reducers = new Map<ConstructType<unknown>, Reducer<any>>(),
): string {
  const roots = [input] as unknown[];
  const indexes = new Map<unknown, number>([[input, 0]]);

  function stringifyRoot(value: unknown) {
    const type = typeof value;
    if (
      type === "object" &&
      value &&
      value.constructor &&
      value.constructor !== Object &&
      value.constructor !== Function
    ) {
      const reducer = reducers.get(value.constructor) ??
        builtInReducers.get(value.constructor);
      if (reducer) {
        const args = reducer[1]?.(value) ?? [];
        const suffix = args.length > 0
          ? `,${args.map(stringifyRef).join(",")}`
          : "";
        return `[${stringify(reducer[0])}${suffix}]`;
      }
    }
    return stringifyAny(value);
  }

  function stringifyAny(value: unknown) {
    const stringified = stringifyPrimitive(value);
    if (stringified) {
      return stringified;
    }
    if (typeof value === "symbol") {
      return Symbol.keyFor(value)
        ? `["Symbol",${stringify(value.description)}]`
        : '["Symbol"]';
    }
    if (Array.isArray(value)) {
      return `[[${value.map(stringifyRef).join(",")}]]`;
    }
    return `{${
      Object.entries(value as object)
        .map(([k, v]) => `${stringify(k)}:${stringifyRef(v)}`)
        .join(",")
    }}`;
  }

  function stringifyRef(value: unknown) {
    const stringified = stringifyPrimitive(value);
    if (stringified) {
      return stringified;
    }
    let idx = indexes.get(value);
    if (typeof idx !== "number") {
      indexes.set(value, idx = roots.length);
      roots.push(value);
    }
    return `[0,${idx}]`;
  }
  return `[${
    Array.from(roots[Symbol.iterator]().map(stringifyRoot)).join(",")
  }]`;
}

function stringifyPrimitive(value: unknown): string | undefined {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "undefined": {
      return "[1]";
    }
    case "number": {
      if (Number.isNaN(value)) {
        return "[2]";
      }
      if (!Number.isFinite(value)) {
        return value > 0 ? "[3]" : "[4]";
      }
      if (value === 0 && 1 / value < 0) {
        return "[5]";
      }
      return `${value}`;
    }
    case "bigint": {
      return `["BigInt","${value}"]`;
    }
    case "boolean": {
      return value ? "true" : "false";
    }
    case "string": {
      return stringify(value);
    }
  }
}
