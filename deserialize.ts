// deno-lint-ignore-file no-explicit-any

import type { AstAny } from "./ast.ts";

export type Reviver<T> = (...args: any[]) => T;

export function deserialize<T = unknown>(
  input: string,
  revivers = new Map<string, Reviver<any>>(),
): T {
  const nodes = JSON.parse(input) as AstAny[];
  const resolved = [] as unknown[];

  function resolveNode(node: AstAny, index?: number): unknown {
    switch (node) {
      case null:
        return null;
    }
    switch (typeof node) {
      case "boolean":
      case "number":
      case "string":
        return node;
    }
    if (Array.isArray(node)) {
      switch (node[0]) {
        case 0: {
          const [, index] = node as [number, number];
          if (index in resolved) {
            return resolved[index];
          }
          return resolved[index] = resolveNode(nodes[index], index);
        }
        case 1:
          return undefined;
        case 2:
          return NaN;
        case 3:
          return Infinity;
        case 4:
          return -Infinity;
        case 5:
          return -0;
      }
      switch (typeof node[0]) {
        case "string": {
          const [name, ...args] = node as [string, ...AstAny[]];
          const reviver = revivers.get(name);
          if (reviver) {
            return reviver(...args.map(resolveNode));
          }
          switch (name) {
            case "Set": {
              const set = new Set();
              if (index !== undefined) resolved[index] = set;
              for (const arg of args) {
                set.add(resolveNode(arg));
              }
              return set;
            }
            case "Map": {
              const map = new Map();
              if (index !== undefined) resolved[index] = map;
              for (const arg of args) {
                map.set(...resolveNode(arg) as [unknown, unknown]);
              }
              return map;
            }
            case "BigInt": {
              return BigInt(args[0] as string);
            }
            case "Symbol": {
              return args[0] ? Symbol.for(args[0] as string) : Symbol();
            }
            case "Date": {
              return new Date(args[0] as number);
            }
            case "RegExp": {
              return new RegExp(...(args as [string, string | undefined]));
            }
          }
          return resolveNode(args[0]);
        }
      }
      const array = [] as unknown[];
      if (index !== undefined) resolved[index] = array;
      for (const item of node[0]) {
        array.push(resolveNode(item));
      }
      return array;
    }

    const obj = {} as Record<string, unknown>;
    if (index !== undefined) resolved[index] = obj;
    for (const [k, v] of Object.entries(node)) {
      obj[k] = resolveNode(v);
    }
    return obj;
  }
  return resolveNode(nodes[0], 0) as T;
}
