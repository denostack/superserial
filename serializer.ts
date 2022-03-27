import { serialize } from "./serialize.ts";
import { deserialize } from "./deserialize.ts";

export interface SerializerOptions {
  classes?: { [className: string]: Function };
}

export class Serializer {
  constructor(public options?: SerializerOptions) {
  }

  serialize(value: any): string {
    return serialize(value);
  }

  deserialize<T = any>(code: string): T {
    return deserialize(code, this.options);
  }
}
