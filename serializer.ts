import {
  type ClassLoadHandler,
  deserialize,
  type DeserializeOptions,
} from "./deserialize.ts";
import { serialize, type SerializeOptions } from "./serialize.ts";
import type { ConstructType } from "./types.ts";

export interface SerializerOptions {
  classes?: { [className: string]: ConstructType<unknown> };
  loadClass?: ClassLoadHandler;
}

export class Serializer {
  #classNames?: Map<ConstructType<unknown>, string>;

  constructor(public options?: SerializerOptions) {
  }

  serialize(value: unknown, options: SerializeOptions = {}): string {
    return serialize(value, {
      prettify: options.prettify,
      classNames: options.classNames ?? (
        this.#classNames ??= new Map(
          Object.entries(this.options?.classes ?? {}).map((
            [key, value],
          ) => [value, key]),
        )
      ),
    });
  }

  deserialize<T = unknown>(code: string, options: DeserializeOptions = {}): T {
    return deserialize<T>(code, {
      classes: options?.classes ?? this.options?.classes,
      loadClass: options?.loadClass ?? this.options?.loadClass,
    });
  }
}
