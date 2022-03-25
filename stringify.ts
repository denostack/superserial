export function stringify(value: any): string {
  let inc = 0;
  const objects = new Map<number, any>();
  const objectIndexMap = new Map<any, number>();

  function _stringify(value: any): string {
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
      return `[${value.map(_stringify).join(",")}]`;
    }

    let oIdx = objectIndexMap.get(value);
    if (typeof oIdx !== "number") {
      oIdx = inc++;
      objectIndexMap.set(value, oIdx);
      objects.set(
        oIdx,
        `{${
          Object.entries(value).map(([k, v]) => {
            return `"${k.replace('"', '\\"')}":${_stringify(v)}`;
          }).join(",")
        }}`,
      );
    }
    return `$${oIdx}`;
  }

  const root = _stringify(value);
  if (inc === 0) {
    return root;
  }
  let result = "";
  for (let i = 0; i < inc; i++) {
    result += (i ? ";" : "") + objects.get(i);
  }
  return result;
}
