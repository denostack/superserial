// deno-lint-ignore-file no-explicit-any

import { serialize, SerializeOptions } from "./serialize";
import { deserialize } from "./deserialize";

export interface SerializerOptions {
  // deno-lint-ignore ban-types
  classes?: { [className: string]: ((new (...args: any[]) => any) | Function) };
}

export class Serializer {
  constructor(public options?: SerializerOptions) {
  }

  serialize(value: any, options?: SerializeOptions): string {
    return serialize(value, options);
  }

  deserialize<T = any>(code: string): T {
    return deserialize(code, this.options);
  }
}
