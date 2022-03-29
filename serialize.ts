// deno-lint-ignore-file no-explicit-any
import { toSerialize } from "./symbol.ts";

export function serialize(value: any): string {
  let inc = 0;
  const objects = new Map<number, string>();
  const objectIndexMap = new Map<any, number>();

  function _stringifyAny(value: any): string {
    if (value === null) {
      return "null";
    }
    const typeofValue = typeof value;
    if (typeofValue === "undefined") {
      return "undefined";
    }
    if (typeofValue === "number") {
      if (Number.isNaN(value)) {
        return "NaN";
      }
      if (!Number.isFinite(value)) {
        return value > 0 ? "Infinity" : "-Infinity";
      }
      return `${value}`;
    }
    if (typeofValue === "bigint") {
      return `${value}n`;
    }
    if (typeofValue === "boolean") {
      return value ? "true" : "false";
    }
    if (typeofValue === "string") {
      return `"${value.replace('"', '\\"')}"`; // " 문자는 escape 해야합니다.
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    let oIdx = objectIndexMap.get(value);
    if (typeof oIdx !== "number") {
      oIdx = inc++;
      objectIndexMap.set(value, oIdx);
      const serialized = _stringifyRef(value);
      objects.set(oIdx, serialized);
      if (oIdx === 0) {
        return serialized;
      }
    }
    return `$${oIdx}`;
  }

  function _stringifyRef(value: any): string {
    if (typeof value === "symbol") {
      const description = (value.description ?? null) === null
        ? ""
        : _stringifyAny(value.description);
      return `Symbol(${description})`;
    }
    if (Array.isArray(value)) {
      return `[${value.map(_stringifyAny).join(",")}]`;
    }
    if (value instanceof Map) {
      return `Map([${[...value.entries()].map(_stringifyAny).join(",")}])`;
    }
    if (value instanceof Set) {
      return `Set([${[...value].map(_stringifyAny).join(",")}])`;
    }
    if (value instanceof Date) {
      return `Date(${_stringifyAny(value.getTime())})`;
    }
    const name = value.constructor !== Object && value.constructor !== Function
      ? value.constructor.name
      : "";

    const serializeBase = typeof value[toSerialize] === "function"
      ? value[toSerialize]()
      : value;
    return `${name}{${
      Object.entries(serializeBase).map(([k, v]) => {
        return `"${k.replace('"', '\\"')}":${_stringifyAny(v)}`;
      }).join(",")
    }}`;
  }

  let result = _stringifyAny(value);
  for (let i = 1; i < inc; i++) {
    result += (i ? ";" : "") + objects.get(i);
  }
  return result;
}
