// deno-lint-ignore-file no-explicit-any

import { serialize, SerializeOptions } from './serialize';
import { deserialize } from './deserialize';
import { ClassCallable } from 'js-prototypes/dist/libs/Function';

export interface SerializerOptions {
  // deno-lint-ignore ban-types
  classes?: { [className: string]: ClassCallable };
}

export class Serializer {
  options: SerializerOptions = {
    classes: {},
  };
  constructor(options?: SerializerOptions) {
    if (options) this.options = Object.assign(this.options, options);
  }

  serialize(value: any, options?: SerializeOptions): string {
    return serialize(value, options);
  }

  deserialize<T = any>(code: string): T {
    return deserialize(code, this.options);
  }
}
