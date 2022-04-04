// deno-lint-ignore-file no-explicit-any

import { serialize as Encode, SerializeOptions } from './serialize';
import { deserialize as Decode } from './deserialize';
import 'js-prototypes';
import { ClassCallable } from 'js-prototypes/src/Function';

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
    return Encode(value, options);
  }

  deserialize<T = any>(code: string): T {
    const opt = this.options ? this.options : {
      classes: {},
    }
    return Decode(code, opt);
  }
}
