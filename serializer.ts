import { serialize } from "./serialize.ts";
import { deserialize } from "./deserialize.ts";

export class Serializer {
  serialize(value: any): string {
    return serialize(value);
  }

  deserialize<T = any>(code: string): T {
    return deserialize(code);
  }
}
