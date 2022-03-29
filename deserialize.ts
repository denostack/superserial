// deno-lint-ignore-file no-explicit-any

import { toDeserialize } from "./symbol.ts";

const WS_CHARS = new Set(["\r", "\n", "\t", " "]);
const NUM_CHARS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

const REPLACER_MAP = (obj: any) => new Map(obj);
const REPLACER_SET = (obj: any) => new Set(obj);

const STRING_ESC: Record<string, string | undefined> = {
  '"': '"',
  "\\": "\\",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

export interface DeserializeOptions {
  // deno-lint-ignore ban-types
  classes?: { [className: string]: ((new (...args: any[]) => any) | Function) };
}

export function deserialize(
  code: string,
  options: DeserializeOptions = {},
): any {
  const mapClasses = options.classes ?? {};

  const refs = [] as any[];
  const replacers = [[], []] as [
    paths: (string | number)[],
    replacer: (origin: any) => any,
  ][][];

  const REPLACER_REF = (index: number) => refs[index];

  const buf = code;
  const paths = [] as (string | number)[];
  let pos = 0;

  function white() {
    while (WS_CHARS.has(buf[pos])) {
      pos++;
    }
  }

  function consume(char: string) {
    while (char.length) {
      if (buf[pos] === char[0]) {
        pos++;
        char = char.slice(1);
        continue;
      }
      throw error();
    }
  }

  function error() {
    return new SyntaxError(
      `Unexpected ${
        buf[pos] ? `token ${buf[pos]}` : "end"
      } in JSON at position ${pos}`,
    );
  }

  function parseJson(): any {
    white();
    switch (buf[pos]) {
      case "$":
        return parseRef();
      case "{":
        return parseObject();
      case "[":
        return parseArray();
      case "/":
        return parseRegExp();
      case '"':
        return parseString();
      case "-":
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9": {
        return parseNumber();
      }
      default: {
        const name = parseName();
        switch (name) {
          case "NaN":
            return NaN;
          case "Infinity":
            return Infinity;
          case "undefined":
            return undefined;
          case "null":
            return null;
          case "true":
            return true;
          case "false":
            return false;
        }
        if (buf[pos] === "{") {
          let obj = parseObject();
          const baseClass = mapClasses[name] ?? null;
          if (baseClass) {
            if (typeof (baseClass as any)[toDeserialize] === "function") {
              obj = (baseClass as any)[toDeserialize](obj);
            }
            Object.setPrototypeOf(obj, baseClass.prototype);
          } else if (name) {
            console.warn(`Class ${name} is not defined. It will be ignored.`);
          }
          return obj;
        } else if (buf[pos] === "(") {
          switch (name) {
            case "Map":
            case "Set":
            case "Date":
            case "Symbol":
              return parseBuiltIn(name);
            default:
              throw error();
          }
        }
      }
    }

    throw error();
  }

  function parseRef() {
    pos++;
    let result = "";
    while (NUM_CHARS.has(buf[pos])) {
      result += buf[pos++];
    }
    const index = +result;
    replacers[0].push([paths.slice(), REPLACER_REF]);
    return index;
  }

  function parseArray() {
    pos++;
    white();
    if (buf[pos] === "]") {
      pos++;
      return [];
    }
    let index = 0;

    paths.push(index++);
    const result = [parseJson()];
    paths.pop();

    white();
    while (buf[pos] === ",") {
      pos++;

      paths.push(index++);
      result.push(parseJson());
      paths.pop();

      white();
    }
    if (buf[pos] === "]") {
      pos++;
      return result;
    }
    throw error();
  }

  function parseObject() {
    pos++;
    white();
    if (buf[pos] === "}") {
      pos++;
      return {};
    }
    const result = {} as Record<string, any>;
    while (1) {
      const key = parseString();
      white();
      if (buf[pos] !== ":") {
        throw error();
      }
      pos++;

      paths.push(key as string);
      result[key as string] = parseJson();
      paths.pop();

      white();
      if (buf[pos] === ",") {
        pos++;
        white();
        continue;
      }
      if (buf[pos] === "}") {
        pos++;
        return result;
      }
      throw error();
    }
  }

  function parseBuiltIn(name: "Map" | "Set" | "Date" | "Symbol") {
    pos++;
    white();
    let value = undefined as any;
    if (buf[pos] === ")") {
      pos++;
    } else {
      value = parseJson();
      white();
      if (buf[pos] !== ")") {
        throw error();
      }
      pos++;
    }

    if (name === "Map") {
      replacers[1].push([paths.slice(), REPLACER_MAP]);
      return value;
    } else if (name === "Set") {
      replacers[1].push([paths.slice(), REPLACER_SET]);
      return value;
    } else if (name === "Date") {
      return new Date(value);
    } else if (name === "Symbol") {
      return Symbol(value);
    }
  }

  function parseNumber() {
    let result = "";
    let isNeg = false;
    if (buf[pos] === "-") {
      isNeg = true;
      pos++;
    }
    if (buf[pos] === "I") {
      pos++;
      consume("nfinity");
      return isNeg ? -Infinity : Infinity;
    }
    if (NUM_CHARS.has(buf[pos])) {
      result += buf[pos++];
    } else {
      throw error();
    }
    while (NUM_CHARS.has(buf[pos])) {
      result += buf[pos++];
    }
    if (buf[pos] === "n") {
      pos++;
      return BigInt(isNeg ? `-${result}` : result);
    } else {
      if (buf[pos] === ".") {
        result += buf[pos++];
        if (NUM_CHARS.has(buf[pos])) {
          result += buf[pos++];
        } else {
          throw error();
        }
        while (NUM_CHARS.has(buf[pos])) {
          result += buf[pos++];
        }
      }
      if (buf[pos] === "e" || buf[pos] === "E") {
        result += buf[pos++];
        if (buf[pos] === "-" || buf[pos] === "+") {
          result += buf[pos++];
        }
        if (NUM_CHARS.has(buf[pos])) {
          result += buf[pos++];
        } else {
          throw error();
        }
        while (NUM_CHARS.has(buf[pos])) {
          result += buf[pos++];
        }
      }
    }
    return isNeg ? -1 * +result : +result;
  }

  function parseString() {
    let result = "";
    pos++;
    while (1) {
      if (buf[pos] === '"') {
        pos++;
        return result;
      }
      if (buf[pos] === "\\") {
        pos++;
        if (buf[pos] === "u") {
          pos++;
          let uffff = 0;
          for (let i = 0; i < 4; i++) {
            const hex = parseInt(buf[pos], 16);
            if (!isFinite(hex)) {
              throw error();
            }
            pos++;
            uffff = uffff * 16 + hex;
          }
          result += String.fromCharCode(uffff);
        } else if (STRING_ESC[buf[pos]]) {
          result += STRING_ESC[buf[pos]];
          pos++;
        } else {
          throw error();
        }
      } else {
        result += buf[pos++];
      }
    }
  }

  function parseRegExp() {
    let result = "";
    pos++;
    if (buf[pos] === "/") {
      throw error();
    }
    while (1) {
      if (buf[pos] === "/") {
        pos++;
        switch (buf[pos]) {
          case "i": {
            pos++;
            switch (buf[pos]) {
              case "m": {
                pos++;
                if (buf[pos] === "g") {
                  pos++;
                  return new RegExp(result, "img");
                } else {
                  return new RegExp(result, "im");
                }
              }
              case "g": {
                pos++;
                if (buf[pos] === "m") {
                  pos++;
                  return new RegExp(result, "igm");
                } else {
                  return new RegExp(result, "ig");
                }
              }
              default: {
                return new RegExp(result, "i");
              }
            }
          }
          case "m": {
            pos++;
            switch (buf[pos]) {
              case "i": {
                pos++;
                if (buf[pos] === "g") {
                  pos++;
                  return new RegExp(result, "mig");
                } else {
                  return new RegExp(result, "mi");
                }
              }
              case "g": {
                pos++;
                if (buf[pos] === "i") {
                  pos++;
                  return new RegExp(result, "mgi");
                } else {
                  return new RegExp(result, "mg");
                }
              }
              default: {
                return new RegExp(result, "m");
              }
            }
          }
          case "g": {
            pos++;
            switch (buf[pos]) {
              case "m": {
                pos++;
                if (buf[pos] === "i") {
                  pos++;
                  return new RegExp(result, "gmi");
                } else {
                  return new RegExp(result, "gm");
                }
              }
              case "i": {
                pos++;
                if (buf[pos] === "m") {
                  pos++;
                  return new RegExp(result, "gim");
                } else {
                  return new RegExp(result, "gi");
                }
              }
              default: {
                return new RegExp(result, "g");
              }
            }
          }
        }
        return new RegExp(result);
      } else if (buf[pos] === "\\") {
        result += buf[pos++];
        result += buf[pos++];
      } else {
        result += buf[pos++];
      }
    }
  }

  function parseName() {
    let chartCode = buf.charCodeAt(pos);
    let result = "";
    if (
      chartCode >= 65 && chartCode <= 90 || chartCode >= 97 && chartCode <= 122
    ) {
      result += buf[pos++];
    } else {
      return result;
    }
    while ((chartCode = buf.charCodeAt(pos))) {
      if (
        chartCode >= 65 && chartCode <= 90 ||
        chartCode >= 97 && chartCode <= 122 ||
        chartCode >= 48 && chartCode <= 57 ||
        chartCode === 95
      ) {
        result += buf[pos++];
      } else {
        break;
      }
    }
    return result;
  }

  let index = 0;
  paths.push(index++);
  refs.push(parseJson());
  paths.pop();

  white();
  while (buf[pos] === ";") {
    consume(";");
    paths.push(index++);
    refs.push(parseJson());
    paths.pop();
    white();
  }

  if (buf.length !== pos) {
    throw error();
  }

  for (const groups of replacers) {
    for (const [paths, replacer] of groups) {
      let base = refs as any;
      for (const [pathIndex, path] of paths.entries()) {
        if (pathIndex === paths.length - 1) {
          base[path] = replacer(base[path]);
          break;
        }
        base = base[path];
      }
    }
  }

  return refs[0];
}
