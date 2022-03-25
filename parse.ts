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

export function parse(ctx: string) {
  const buf = ctx;
  let pos = 0;

  function white() {
    while (WS_CHARS.has(buf[pos])) {
      pos++;
    }
  }

  function consume(char: string) {
    if (buf[pos] === char) {
      pos++;
      return;
    }
    throw error();
  }

  function error() {
    return new SyntaxError(
      `Unexpected ${
        buf[pos] ? `token ${buf[pos]}` : "end"
      } in JSON at position ${pos}`,
    );
  }

  function json(): any {
    white();
    switch (buf[pos]) {
      case "{":
        return object();
      case "[":
        return array();
      case "/":
        return regexp();
      case '"':
        return string();
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
        return number();
      }
      case "t": {
        pos++;
        consume("r");
        consume("u");
        consume("e");
        return true;
      }
      case "f": {
        pos++;
        consume("a");
        consume("l");
        consume("s");
        consume("e");
        return false;
      }
      case "n": {
        pos++;
        consume("u");
        consume("l");
        consume("l");
        return null;
      }
    }
    throw error();
  }

  function array() {
    pos++;
    white();
    if (buf[pos] === "]") {
      pos++;
      return [];
    }
    const result = [json()];
    white();
    while (buf[pos] === ",") {
      pos++;
      result.push(json());
      white();
    }
    if (buf[pos] === "]") {
      pos++;
      return result;
    }
    throw error();
  }

  function object() {
    pos++;
    white();
    if (buf[pos] === "}") {
      pos++;
      return {};
    }
    const result = {} as Record<string, any>;
    while (1) {
      const key = string();
      white();
      if (buf[pos] !== ":") {
        throw error();
      }
      pos++;
      result[key as string] = json();
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

  function number() {
    if (buf[pos] === "N") {
      pos++;
      consume("a");
      consume("N");
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
      consume("n");
      consume("f");
      consume("i");
      consume("n");
      consume("i");
      consume("t");
      consume("y");
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
    return isNeg ? -1 * +result : +result;
  }

  function string() {
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

  function regexp() {
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

  const result = json();
  white();
  if (buf.length !== pos) {
    throw error();
  }
  return result;
}
