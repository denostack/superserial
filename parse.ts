const WS_CHARS = new Set(["\r", "\n", "\t", " "]);
const NUM_CHARS = new Set(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);

const STRING_ESC: Record<string, string | undefined> = {
  '"': '"',
  "\\": "\\",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

export function parse(code: string) {
  const refSymbol = Symbol();
  const refs = [] as any[];
  const buf = code;
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
      case "I":
      case "N":
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
      case "u": {
        pos++;
        consume("ndefined");
        return undefined;
      }
      case "t": {
        pos++;
        consume("rue");
        return true;
      }
      case "f": {
        pos++;
        consume("alse");
        return false;
      }
      case "n": {
        pos++;
        consume("ull");
        return null;
      }
    }
    throw error();
  }

  function parseRef() {
    pos++;
    let result = "";
    while (NUM_CHARS.has(buf[pos])) {
      result += buf[pos];
      pos++;
    }
    const index = +result;
    return Object.assign(() => refs[index], { ref: refSymbol });
  }

  function parseArray() {
    pos++;
    white();
    if (buf[pos] === "]") {
      pos++;
      return [];
    }
    const result = [parseJson()];
    white();
    while (buf[pos] === ",") {
      pos++;
      result.push(parseJson());
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
      result[key as string] = parseJson();
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

  function parseNumber() {
    if (buf[pos] === "N") {
      pos++;
      consume("aN");
      return NaN;
    }

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
      result += buf[pos];
      pos++;
    } else {
      throw error();
    }
    while (NUM_CHARS.has(buf[pos])) {
      result += buf[pos];
      pos++;
    }
    if (buf[pos] === "n") {
      pos++;
      return BigInt(isNeg ? `-${result}` : result);
    } else {
      if (buf[pos] === ".") {
        result += ".";
        pos++;
        if (NUM_CHARS.has(buf[pos])) {
          result += buf[pos];
          pos++;
        } else {
          throw error();
        }
        while (NUM_CHARS.has(buf[pos])) {
          result += buf[pos];
          pos++;
        }
      }
      if (buf[pos] === "e" || buf[pos] === "E") {
        result += buf[pos];
        pos++;
        if (buf[pos] === "-" || buf[pos] === "+") {
          result += buf[pos];
          pos++;
        }
        if (NUM_CHARS.has(buf[pos])) {
          result += buf[pos];
          pos++;
        } else {
          throw error();
        }
        while (NUM_CHARS.has(buf[pos])) {
          result += buf[pos];
          pos++;
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
            let hex = parseInt(buf[pos], 16);
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
        result += buf[pos];
        pos++;
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
        result += buf[pos];
        pos++;
        result += buf[pos];
        pos++;
      } else {
        result += buf[pos];
        pos++;
      }
    }
  }

  refs.push(parseJson());
  white();
  while (buf[pos] === ";") {
    consume(";");
    refs.push(parseJson());
    white();
  }

  if (buf.length !== pos) {
    throw error();
  }

  // resolve ref
  function resolveRef(value: any) {
    const typeofValue = typeof value;
    if (typeofValue === "function" && value.ref === refSymbol) {
      return value();
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = resolveRef(value[i]);
      }
    }
    if (typeofValue === "object" || typeofValue === "function") {
      for (const key in value) {
        value[key] = resolveRef(value[key]);
      }
    }
    return value;
  }

  return resolveRef(refs[0]);
}
