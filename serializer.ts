// deno-lint-ignore-file no-explicit-any

import { serialize, SerializeOptions } from "./serialize.ts";
import { ClassLoadHandler, deserialize } from "./deserialize.ts";
import { ConstructType } from "./types.ts";

export interface SerializerOptions {
  classes?: { [className: string]: ConstructType<unknown> };
  loadClass?: ClassLoadHandler;
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
