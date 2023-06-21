// deno-lint-ignore-file no-explicit-any
import { builtInTransformersMap } from "./builtin_transformers.ts";
import { toSerialize } from "./symbol.ts";
import { Transformer } from "./transformer.ts";

export interface SerializeOptions {
  transformers?: Map<any, Transformer<any, any>>;
}

export function serialize(
  value: any,
  options: SerializeOptions = {},
): string {
  const transformers = options.transformers ?? builtInTransformersMap;

  let output = "";

  let inc = 0;

  const objectMap = new Map<number, any>();
  const objectIndexMap = new Map<any, number>();

  function _stringifyString(value: string): boolean {
    output += JSON.stringify(value); // fastest way
    return true;
  }
  function _stringifyScalar(value: any): boolean {
    if (value === null) {
      output += "null";
      return true;
    }
    const typeofValue = typeof value;
    if (typeofValue === "undefined") {
      output += "undefined";
      return true;
    }
    if (typeofValue === "number") {
      if (Number.isNaN(value)) {
        output += "NaN";
        return true;
      }
      if (!Number.isFinite(value)) {
        output += value > 0 ? "Infinity" : "-Infinity";
        return true;
      }
      output += `${value}`;
      return true;
    }
    if (typeofValue === "bigint") {
      output += `${value}n`;
      return true;
    }
    if (typeofValue === "boolean") {
      output += value ? "true" : "false";
      return true;
    }
    if (typeofValue === "string") {
      return _stringifyString(value);
    }
    return false;
  }

  function _stringifyRoot(value: any): boolean {
    if (_stringifyScalar(value)) {
      return true;
    }
    return _stringifyRef(value);
  }

  function _stringifyAny(value: any): boolean {
    if (_stringifyScalar(value)) {
      return true;
    }

    let oIdx = objectIndexMap.get(value);
    if (typeof oIdx !== "number") {
      oIdx = inc++;
      objectIndexMap.set(value, oIdx);
      objectMap.set(oIdx, value);
    }
    output += `$${oIdx}`;
    return true;
  }

  function _stringifyRef(value: any): boolean {
    // simple :-)
    if (typeof value === "symbol") {
      output += "Symbol(";
      if (value.description) {
        _stringifyString(value.description);
      }
      output += ")";
      return true;
    }

    if (value instanceof RegExp) {
      output += value.toString();
      return true;
    }

    // if (value instanceof Date) {
    //   output += "Date(";
    //   _stringifyAny(value.getTime());
    //   output += ")";
    //   return true;
    // }

    if (Array.isArray(value)) {
      _stringifyListStart("[");
      _stringifyList(value);
      _stringifyListEnd("]");
      return true;
    }

    const ctor = value.constructor;
    const transformer = transformers.get(ctor);
    if (transformer) {
      const name = transformer.name ?? ctor.name;
      const serialized = transformer.serialize?.(value) ?? value;
      if (Array.isArray(serialized)) {
        _stringifyListStart(`${name}(`);
        _stringifyList(serialized);
        _stringifyListEnd(")");
        return true;
      }
      console.log(value);
      if (value instanceof Map) {
        _stringifyListStart(`${name}(`);
        _stringifyMap([...value.entries()]);
        _stringifyListEnd(")");
        return true;
      }
      _stringifyListStart(`${name}{`);
      _stringifyKv(Object.entries(serialized));
      _stringifyListEnd("}");
    }

    const name = value.constructor && value.constructor !== Object &&
        value.constructor !== Function
      ? value.constructor.name
      : "";

    _stringifyListStart(`${name}{`);
    _stringifyKv(
      Object.entries(
        typeof value[toSerialize] === "function" ? value[toSerialize]() : value,
      ),
    );
    _stringifyListEnd("}");
    return true;
  }

  const _stringifyListStart = (name: string) => {
    output += name;
  };

  const _stringifyListEnd = (name: string) => {
    output += name;
  };

  const _stringifyList = (value: any[]) => {
    for (let i = 0; i < value.length; i++) {
      if (i > 0) {
        output += ",";
      }
      _stringifyAny(value[i]);
    }
  };
  const _stringifyMap = (value: [string, any][]) => {
    for (let i = 0; i < value.length; i++) {
      if (i > 0) {
        output += ",";
      }
      _stringifyAny(value[i][0]);
      output += "=>";
      _stringifyAny(value[i][1]);
    }
  };
  const _stringifyKv = (value: [string, any][]) => {
    for (let i = 0; i < value.length; i++) {
      if (i > 0) {
        output += ",";
      }
      _stringifyString(value[i][0]);
      output += ":";
      _stringifyAny(value[i][1]);
    }
  };

  inc++;
  objectIndexMap.set(value, 0);
  objectMap.set(0, value);

  _stringifyRoot(value);
  for (let i = 1; i < inc; i++) {
    output += ";";
    _stringifyRoot(objectMap.get(i));
  }
  return output;
}
