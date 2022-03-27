import { toSerialize } from "./symbol.ts";

export function serialize(value: any): string {
  let inc = 0;
  const objects = new Map<number, any>();
  const objectIndexMap = new Map<any, number>();

  function _traverse(value: any): string {
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

    if (Array.isArray(value)) {
      return `[${value.map(_traverse).join(",")}]`;
    }

    let oIdx = objectIndexMap.get(value);
    if (typeof oIdx !== "number") {
      oIdx = inc++;
      objectIndexMap.set(value, oIdx);

      const name =
        value.constructor !== Object && value.constructor !== Function
          ? value.constructor.name
          : "";

      const serializeBase = typeof value[toSerialize] === "function"
        ? value[toSerialize]()
        : value;
      const objAsString = `${name}{${
        Object.entries(serializeBase).map(([k, v]) => {
          return `"${k.replace('"', '\\"')}":${_traverse(v)}`;
        }).join(",")
      }}`;

      objects.set(oIdx, objAsString);
      if (oIdx === 0) {
        return objAsString;
      }
    }
    return `$${oIdx}`;
  }

  let result = _traverse(value);
  for (let i = 1; i < inc; i++) {
    result += (i ? ";" : "") + objects.get(i);
  }
  return result;
}
