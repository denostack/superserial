import { stringify } from "./stringify.ts";
import { parse } from "./parse.ts";

export class Serializer {
  serialize(value: any): string {
    return stringify(value);
  }

  deserialize<T = any>(code: string): T {
    return parse(code);
  }
}
