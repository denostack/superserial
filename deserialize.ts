// deno-lint-ignore-file no-explicit-any

import { AstAny, AstRoot, parse } from "./parse.ts";
import { toDeserialize } from "./symbol.ts";

export interface DeserializeOptions {
  // deno-lint-ignore ban-types
  classes?: { [className: string]: ((new (...args: any[]) => any) | Function) };
}

export function deserialize(
  ctx: string,
  options: DeserializeOptions = {},
): any {
  const mapClasses = options.classes ?? {};

  const refs = [] as any[];
  const valueMap = new Map<AstAny, any>();
  const resolvers = [] as (() => void)[];

  function transformAstAny(ast: AstAny) {
    if (ast[0] === 64) {
      const index = ast[1];
      if (index in refs) {
        return refs[index];
      }
      throw new Error(`not found ref $${index}`);
    }
    return transformAstRoot(ast);
  }

  function transformAstRoot(ast: AstRoot) {
    const value = valueMap.get(ast);
    if (value) {
      return value;
    }
    switch (ast[0]) {
      case 0:
        return undefined;
      case 1:
        return null;
      case 2: // boolean
      case 3: // number
      case 4: // bigint
      case 5: // string
        return ast[1];
      case 6: {
        const value = typeof ast[1] === "string" ? Symbol(ast[1]) : Symbol();
        valueMap.set(ast, value);
        return value;
      }
      case 16: {
        const value = [] as any[];
        valueMap.set(ast, value);
        const items = ast[1];
        resolvers.push(() => {
          value.push(...items.map(transformAstAny));
        });
        return value;
      }
      case 17: {
        const name = ast[1];
        const entries = ast[2];

        const baseClass = name ? mapClasses[name] ?? null : null;
        if (name && !baseClass) {
          console.warn(`Class ${name} is not defined. It will be ignored.`);
        }

        const value = baseClass ? Reflect.construct(baseClass, []) : {};
        valueMap.set(ast, value);
        resolvers.push(() => {
          const merged = Object.fromEntries(
            entries.map(([k, v]) => [k[1], transformAstAny(v)]),
          );
          if (typeof value[toDeserialize] === "function") {
            value[toDeserialize](merged);
          } else {
            Object.assign(value, merged);
          }
        });
        return value;
      }
      case 32: {
        const value = ast[2] ? new RegExp(ast[1], ast[2]) : new RegExp(ast[1]);
        valueMap.set(ast, value);
        return value;
      }
      case 33: {
        const value = new Date(ast[1]);
        valueMap.set(ast, value);
        return value;
      }
      case 34: {
        const value = new Set();
        valueMap.set(ast, value);
        const items = ast[1];
        resolvers.push(() => {
          for (const item of items) {
            value.add(transformAstAny(item));
          }
        });
        return value;
      }
      case 35: {
        const value = new Map();
        valueMap.set(ast, value);
        const entries = ast[1];
        resolvers.push(() => {
          for (const [k, v] of entries) {
            value.set(transformAstAny(k), transformAstAny(v));
          }
        });
        return value;
      }
    }
    throw new Error(`wrong ast type(${ast[0]})`);
  }

  for (const [rootIndex, root] of parse(ctx).entries()) {
    refs[rootIndex] = transformAstRoot(root);
  }

  let resolver: (() => void) | undefined;
  while ((resolver = resolvers.shift())) {
    resolver();
  }

  return refs[0];
}
