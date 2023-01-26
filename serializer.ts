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

  serialize(value: unknown, options?: SerializeOptions): string {
    return serialize(value, options);
  }

  deserialize<T = unknown>(code: string): T {
    return deserialize<T>(code, this.options);
  }
}
