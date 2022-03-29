// deno-lint-ignore-file no-explicit-any

import { serialize } from "./serialize.ts";
import { deserialize } from "./deserialize.ts";

export interface SerializerOptions {
  // deno-lint-ignore ban-types
  classes?: { [className: string]: ((new (...args: any[]) => any) | Function) };
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
