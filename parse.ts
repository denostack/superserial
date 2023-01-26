const NUM_CHARS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

export type AstRoot =
  | AstUndefined
  | AstNull
  | AstBool
  | AstNumber
  | AstBigInt
  | AstString
  | AstSymbol
  | AstArray
  | AstObject
  | AstRegExp
  | AstDate
  | AstSet
  | AstMap;

export type AstAny = AstRoot | AstRef;

export type AstUndefined = [type: 0];
export type AstNull = [type: 1];
export type AstBool = [type: 2, value: boolean];
export type AstNumber = [type: 3, value: number];
export type AstBigInt = [type: 4, value: bigint];
export type AstString = [type: 5, value: string];
export type AstSymbol = [type: 6, description: string | null];

export type AstArray = [type: 16, items: AstAny[]];
export type AstObject = [
  type: 17,
  name: string | null,
  entries: [AstString, AstAny][],
];

export type AstRegExp = [type: 32, pattern: string, flags: string | null];
export type AstDate = [type: 33, timestamp: number];
export type AstSet = [type: 34, items: AstAny[]];
export type AstMap = [type: 35, entries: [AstAny, AstAny][]];

export type AstRef = [type: 64, index: number];

let buf = "";
let pos = 0;

function consume(s: string) {
  for (const c of s) {
    if (buf[pos] !== c) {
      throw error();
    }
    pos++;
  }
}

function white() {
  while (1) {
    switch (buf[pos]) {
      case "\t":
      case "\v":
      case "\f":
      case " ":
      case "\u00A0":
      case "\uFEFF":
      case "\n":
      case "\r":
      case "\u2028":
      case "\u2029":
        pos++;
        break;
      default:
        return;
    }
  }
}

function error() {
  return new SyntaxError(
    buf[pos]
      ? `Unexpected token '${buf[pos]}' in SuperSerial at position ${pos + 1}`
      : "Unexpected end of SuperSerial input",
  );
}

function parseAny(): AstAny {
  white();
  if (buf[pos] === "$") {
    pos++;
    let result = "";
    while (NUM_CHARS.has(buf[pos])) {
      result += buf[pos++];
    }
    return [64, +result];
  }
  return parseRoot();
}

function parseRoot(): AstRoot {
  white();
  switch (buf[pos]) {
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
    case '"':
      return parseString();
    case "[":
      return parseArray();
    case "/":
      return parseRegExp();
    default: {
      const name = keyword();
      switch (name) {
        case "null":
          return [1];
        case "true":
          return [2, true];
        case "false":
          return [2, false];
      }
      if (buf[pos] === "{") {
        return parseObject(name);
      }
      switch (name) {
        case "undefined":
          return [0];
        case "NaN":
          return [3, NaN];
        case "Infinity":
          return [3, Infinity];
      }
      if (buf[pos] === "(") {
        switch (name) {
          case "Map":
            return parseMap();
          case "Set":
            return parseSet();
          case "Date":
            return parseDate();
          case "Symbol":
            return parseSymbol();
          default:
            throw error();
        }
      }
    }
  }

  throw error();
}

function parseNumber(): AstNumber | AstBigInt {
  let result = "";
  let mult = 1;

  if (buf[pos] === "-") {
    pos++;
    mult = -1;
  }
  if (buf[pos] === "I") {
    pos++;
    consume("nfinity");
    return [3, mult * Infinity];
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
    return [4, BigInt(result) * BigInt(mult)];
  } else {
    if (buf[pos] === ".") {
      result += buf[pos++];
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
  return [3, +result * mult];
}

function parseString(): AstString {
  let result = "";
  pos++;
  while (1) {
    if (pos >= buf.length) {
      break;
    }
    switch (buf[pos]) {
      case '"':
        pos++;
        return [5, result];
      case "\\":
        pos++;
        switch (buf[pos]) {
          case "u": {
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
            continue;
          }
          case '"':
            pos++;
            result += '"';
            continue;
          case "\\":
            pos++;
            result += "\\";
            continue;
          case "b":
            pos++;
            result += "\b";
            continue;
          case "f":
            pos++;
            result += "\f";
            continue;
          case "n":
            pos++;
            result += "\n";
            continue;
          case "r":
            pos++;
            result += "\r";
            continue;
          case "t":
            pos++;
            result += "\t";
            continue;
        }
        break;
      default:
        result += buf[pos++];
        continue;
    }
    break;
  }
  throw error();
}

function parseArray(): AstArray {
  pos++;
  white();
  if (buf[pos] === "]") {
    pos++;
    return [16, []];
  }

  const result = [] as AstAny[];
  result.push(parseAny());

  white();
  while (buf[pos] === ",") {
    pos++;
    result.push(parseAny());
    white();
  }
  if (buf[pos] === "]") {
    pos++;
    return [16, result];
  }
  throw error();
}

function parseObject(name: string | null = null): AstObject {
  pos++;
  white();
  if (buf[pos] === "}") {
    pos++;
    return [17, name, []];
  }
  const result = [] as [AstString, AstAny][];
  while (1) {
    const key = parseString(); // TODO Symbol
    white();
    if (buf[pos] !== ":") {
      throw error();
    }
    pos++;
    result.push([key, parseAny()]);
    white();
    if (buf[pos] === ",") {
      pos++;
      white();
      continue;
    }
    if (buf[pos] === "}") {
      pos++;
      return [17, name, result];
    }
    break;
  }
  throw error();
}

function parseRegExp(): AstRegExp {
  pos++;
  let pattern = "";
  if (buf[pos] === "/") {
    throw error();
  }
  while (buf[pos]) {
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
                return [32, pattern, "img"];
              } else {
                return [32, pattern, "im"];
              }
            }
            case "g": {
              pos++;
              if (buf[pos] === "m") {
                pos++;
                return [32, pattern, "igm"];
              } else {
                return [32, pattern, "ig"];
              }
            }
            default: {
              return [32, pattern, "i"];
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
                return [32, pattern, "mig"];
              } else {
                return [32, pattern, "mi"];
              }
            }
            case "g": {
              pos++;
              if (buf[pos] === "i") {
                pos++;
                return [32, pattern, "mgi"];
              } else {
                return [32, pattern, "mg"];
              }
            }
            default: {
              return [32, pattern, "m"];
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
                return [32, pattern, "gmi"];
              } else {
                return [32, pattern, "gm"];
              }
            }
            case "i": {
              pos++;
              if (buf[pos] === "m") {
                pos++;
                return [32, pattern, "gim"];
              } else {
                return [32, pattern, "gi"];
              }
            }
            default: {
              return [32, pattern, "g"];
            }
          }
        }
      }
      return [32, pattern, null];
    } else if (buf[pos] === "\\") {
      pattern += buf[pos++];
      pattern += buf[pos++];
    } else {
      pattern += buf[pos++];
    }
  }
  throw error();
}

function parseSet(): AstSet {
  pos++;
  white();
  if (buf[pos] === ")") {
    pos++;
    return [34, []];
  }

  const items = [] as AstAny[];
  items.push(parseAny());

  white();
  while (buf[pos] === ",") {
    pos++;
    items.push(parseAny());
    white();
  }
  if (buf[pos] === ")") {
    pos++;
    return [34, items];
  }
  throw error();
}

function parseMap(): AstMap {
  pos++;
  white();
  if (buf[pos] === ")") {
    pos++;
    return [35, []];
  }
  const entries = [] as [AstAny, AstAny][];
  while (1) {
    const key = parseAny();
    white();
    consume("=>");
    white();
    const value = parseAny();
    entries.push([key, value]);
    white();
    if (buf[pos] === ",") {
      pos++;
      white();
      continue;
    }
    if (buf[pos] === ")") {
      pos++;
      break;
    }
    throw error();
  }
  return [35, entries];
}

function parseSymbol(): AstSymbol {
  pos++;
  white();
  if (buf[pos] === ")") {
    pos++;
    return [6, null];
  }
  if (buf[pos] === '"') {
    const valueString = parseString();
    white();
    if (buf[pos] === ")") {
      pos++;
      return [6, valueString[1]];
    }
  }
  throw error();
}

function parseDate(): AstDate {
  pos++;
  white();
  let value = "";
  let mult = 1;
  if (buf[pos] === "-") {
    pos++;
    mult = -1;
  }
  if (NUM_CHARS.has(buf[pos])) {
    value += buf[pos++];
  } else {
    throw error();
  }
  while (NUM_CHARS.has(buf[pos])) {
    value += buf[pos++];
  }
  if (buf[pos] === ".") {
    value += buf[pos++];
    while (NUM_CHARS.has(buf[pos])) {
      value += buf[pos++];
    }
  }
  if (buf[pos] === "e" || buf[pos] === "E") {
    value += buf[pos++];
    if (buf[pos] === "-" || buf[pos] === "+") {
      value += buf[pos++];
    }
    if (NUM_CHARS.has(buf[pos])) {
      value += buf[pos++];
    } else {
      throw error();
    }
    while (NUM_CHARS.has(buf[pos])) {
      value += buf[pos++];
    }
  }
  white();
  if (buf[pos] === ")") {
    pos++;
    return [33, +value * mult];
  }
  throw error();
}

function keyword(): string | null {
  let chartCode = buf.charCodeAt(pos);
  let result = "";
  if (
    chartCode >= 65 && chartCode <= 90 || // UPPERCASE
    chartCode >= 97 && chartCode <= 122 || // lowercase
    chartCode === 95 // _
  ) {
    result += buf[pos++];
  } else {
    return null;
  }
  while ((chartCode = buf.charCodeAt(pos))) {
    if (
      chartCode >= 65 && chartCode <= 90 || // UPPERCASE
      chartCode >= 97 && chartCode <= 122 || // lowercase
      chartCode >= 48 && chartCode <= 57 || // number
      chartCode === 95 // _
    ) {
      result += buf[pos++];
    } else {
      break;
    }
  }
  white();
  return result;
}

export function parse(
  ctx: string,
): AstRoot[] {
  buf = ctx;
  pos = 0;

  const roots = [] as AstRoot[];
  roots.push(parseRoot());
  white();
  while (buf[pos] === ";") {
    pos++;
    roots.push(parseRoot());
    white();
  }

  if (buf.length !== pos) {
    throw error();
  }

  return roots;
}
