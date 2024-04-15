import { toSerialize } from "./symbol.ts";
import type { ConstructType } from "./types.ts";

export interface SerializeOptions {
  classNames?: Map<ConstructType<unknown>, string>;
  prettify?: boolean;
}

export function serialize(
  value: unknown,
  { prettify, classNames }: SerializeOptions = {},
): string {
  let output = "";
  let depth = 0;

  const roots = [] as unknown[];
  const rootIndexMap = new Map<unknown, number>();

  function _stringifyString(value: string) {
    output += JSON.stringify(value); // fastest way
  }

  function _stringifyScalar(
    value: unknown,
  ): value is object | symbol {
    if (value === null) {
      output += "null";
      return false;
    }
    switch (typeof value) {
      case "undefined": {
        output += "undefined";
        return false;
      }
      case "number": {
        if (Number.isNaN(value)) {
          output += "NaN";
          return false;
        }
        if (!Number.isFinite(value)) {
          output += value > 0 ? "Infinity" : "-Infinity";
          return false;
        }
        output += `${value}`;
        return false;
      }
      case "bigint": {
        output += `${value}n`;
        return false;
      }
      case "boolean": {
        output += value ? "true" : "false";
        return false;
      }
      case "string": {
        _stringifyString(value);
        return false;
      }
    }

    return true;
  }

  function _stringifyRoot(value: unknown) {
    if (_stringifyScalar(value)) {
      // simple :-)
      if (typeof value === "symbol") {
        output += "Symbol(";
        if (value.description) {
          _stringifyString(value.description);
        }
        output += ")";
        return;
      }

      if (value instanceof RegExp) {
        output += value.toString();
        return;
      }

      if (value instanceof Date) {
        output += "Date(";
        output += value.getTime().toString();
        output += ")";
        return;
      }

      // complex :D
      if (prettify) {
        output += "  ".repeat(depth);
      }

      if (Array.isArray(value)) {
        _stringifyListStart("[");
        _stringifyList(value);
        _stringifyListEnd("]");
        return;
      }

      if (value instanceof Map) {
        _stringifyListStart("Map(");
        _stringifyMap([...value.entries()]);
        _stringifyListEnd(")");
        return;
      }
      if (value instanceof Set) {
        _stringifyListStart("Set(");
        _stringifyList([...value]);
        _stringifyListEnd(")");
        return;
      }

      const name = value.constructor && value.constructor !== Object &&
          value.constructor !== Function
        ? (classNames?.get(value.constructor) ?? value.constructor.name)
        : "";

      _stringifyListStart(prettify && name ? `${name} {` : `${name}{`);
      _stringifyKv(
        Object.entries(
          toSerialize in value && typeof value[toSerialize] === "function"
            ? value[toSerialize]()
            : value,
        ),
      );
      _stringifyListEnd("}");
      return;
    }
  }

  function _stringifyUnknown(value: unknown) {
    if (_stringifyScalar(value)) {
      let idx = rootIndexMap.get(value);
      if (typeof idx !== "number") {
        rootIndexMap.set(value, idx = roots.length);
        roots.push(value);
      }
      output += `$${idx}`;
    }
  }

  const _stringifyListStart = prettify
    ? (name: string) => {
      output += name;
      output += "\n";
      depth++;
    }
    : (name: string) => {
      output += name;
      depth++;
    };

  const _stringifyListEnd = prettify
    ? (name: string) => {
      depth--;
      output += "\n";
      output += "  ".repeat(depth);
      output += name;
    }
    : (name: string) => {
      depth--;
      output += name;
    };

  const _stringifyList = prettify
    ? (value: unknown[]) => {
      for (let i = 0; i < value.length; i++) {
        if (i > 0) {
          output += ",\n";
        }
        output += "  ".repeat(depth);
        _stringifyUnknown(value[i]);
      }
    }
    : (value: unknown[]) => {
      for (let i = 0; i < value.length; i++) {
        if (i > 0) {
          output += ",";
        }
        _stringifyUnknown(value[i]);
      }
    };
  const _stringifyMap = prettify
    ? (value: [string, unknown][]) => {
      for (let i = 0; i < value.length; i++) {
        if (i > 0) {
          output += ",\n";
        }
        output += "  ".repeat(depth);
        _stringifyUnknown(value[i][0]);
        output += " => ";
        _stringifyUnknown(value[i][1]);
      }
    }
    : (value: [string, unknown][]) => {
      for (let i = 0; i < value.length; i++) {
        if (i > 0) {
          output += ",";
        }
        _stringifyUnknown(value[i][0]);
        output += "=>";
        _stringifyUnknown(value[i][1]);
      }
    };
  const _stringifyKv = prettify
    ? (value: [string, unknown][]) => {
      for (let i = 0; i < value.length; i++) {
        if (i > 0) {
          output += ",\n";
        }
        output += "  ".repeat(depth);
        _stringifyString(value[i][0]);
        output += ": ";
        _stringifyUnknown(value[i][1]);
      }
    }
    : (value: [string, unknown][]) => {
      for (let i = 0; i < value.length; i++) {
        if (i > 0) {
          output += ",";
        }
        _stringifyString(value[i][0]);
        output += ":";
        _stringifyUnknown(value[i][1]);
      }
    };

  rootIndexMap.set(value, 0);
  roots.push(value);

  _stringifyRoot(value);
  const splitter = prettify ? ";\n" : ";";
  for (let i = 1; i < roots.length; i++) {
    output += splitter;
    _stringifyRoot(roots[i]);
  }
  return output;
}
