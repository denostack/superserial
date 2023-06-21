// deno-lint-ignore-file no-explicit-any
import { toSerialize } from "./symbol.ts";

/** @internal */
type Context = [
  rootValues: unknown[],
  index: Map<unknown, number>,
  depth: number,
];

export interface SerializeOptions {
}

export function serialize(value: any, options: SerializeOptions = {}): string {
  const ctx: Context = [[], new Map(), 0];
  ctx[1].set(value, ctx[0].length);
  ctx[0].push(value);

  let output = stringifyRoot(value, ctx);
  for (let i = 1; i < ctx[0].length; i++) {
    output += ";";
    output += stringifyRoot(ctx[0][i], ctx);
  }
  return output;
}

function stringifyRoot(value: unknown, ctx: Context): string {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "undefined":
      return "undefined";
    case "number":
      return stringifyNumber(value);
    case "bigint":
      return `${value}n`;
    case "boolean":
      return value ? "true" : "false";
    case "string":
      return stringifyString(value);
    case "symbol":
      return stringifySymbol(value);
  }
  if (value instanceof RegExp) {
    return value.toString();
  }

  if (value instanceof Date) {
    return `Date(${value.getTime()})`;
  }

  if (value instanceof Set) {
    return stringifyNamedArray("Set", [...value], ctx);
  }

  if (value instanceof Map) {
    let output = "Map(";
    let isFirst = true;
    for (const [k, v] of value.entries()) {
      if (!isFirst) output += ",";
      output += stringifyUnknown(k, ctx);
      output += "=>";
      output += stringifyUnknown(v, ctx);
      isFirst = false;
    }
    return output + ")";
  }

  if (Array.isArray(value)) {
    return stringifyArray(value, ctx);
  }

  const ctor = value.constructor;
  if (!ctor || ctor === Object) {
    return stringifyObject(value, ctx);
  }

  /**
   * benchmark
   * (1) value.constructor === Object (fastest)
   * (2) Array.isArray(value)
   * (3) value instanceof Object
   */
  const name: string = ctor.name ?? "";
  const serialized = hasToSerialize(value) ? value[toSerialize]() : value;

  if (Array.isArray(serialized)) {
    return stringifyNamedArray(name, serialized, ctx);
  }

  if (typeof serialized === "object") {
    return stringifyNamedObject(name, serialized, ctx);
  }

  // unknown
  return "{}";
}

function stringifyNumber(value: number): string {
  if (Number.isNaN(value)) {
    return "NaN";
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? "Infinity" : "-Infinity";
  }
  return `${value}`;
}

function stringifyString(value: string): string {
  return `"${value.replace('"', '\\"')}"`; // " 문자는 escape 해야합니다.
}

function stringifySymbol(value: symbol): string {
  return `Symbol(${
    value.description ? stringifyString(value.description) : ""
  })`;
}

function stringifyArray(value: unknown[], ctx: Context): string {
  return `[${stringifyArrayItems(value, ctx)}]`;
}

function stringifyNamedArray(
  name: string,
  value: unknown[],
  ctx: Context,
): string {
  return `${name}(${stringifyArrayItems(value, ctx)})`;
}

function stringifyArrayItems(value: unknown[], ctx: Context): string {
  return value.map((v) => stringifyUnknown(v, ctx)).join(",");
}

function stringifyObject(value: object, ctx: Context): string {
  return `{${stringifyObjectItems(value, ctx)}}`;
}

function stringifyNamedObject(
  name: string,
  value: object,
  ctx: Context,
): string {
  return `${name}{${stringifyObjectItems(value, ctx)}}`;
}

function stringifyObjectItems(value: object, ctx: Context): string {
  return Object.entries(value).map(([k, v]) =>
    `${stringifyString(k)}:${stringifyUnknown(v, ctx)}`
  ).join(",");
}

function stringifyUnknown(value: unknown, ctx: Context): string {
  if (value === null) {
    return "null";
  }
  switch (typeof value) {
    case "undefined":
      return "undefined";
    case "number":
      return stringifyNumber(value);
    case "bigint":
      return `${value}n`;
    case "boolean":
      return value ? "true" : "false";
    case "string":
      return stringifyString(value);
  }

  let refIdx = ctx[1].get(value);
  if (typeof refIdx !== "number") {
    refIdx = ctx[0].length;
    ctx[1].set(value, refIdx);
    ctx[0].push(value);
  }
  return `$${refIdx}`;
}

function hasToSerialize(
  value: unknown,
): value is { [toSerialize](): unknown[] | object } {
  return typeof (value as any)[toSerialize] === "function";
}
