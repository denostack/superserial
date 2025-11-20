// deno-lint-ignore-file no-explicit-any

import { toDeserialize, toSerialize } from "./constants.ts";
import { deserialize, type Reviver } from "./deserialize.ts";
import { type Reducer, serialize } from "./serialize.ts";
import type { ConstructType } from "./types.ts";

export interface ClassDefinition<T, S> {
  toSerialize?: (value: T) => S;
  toDeserialize?: (value: S) => T;
}

export interface DefineClassOptions<T, S> extends ClassDefinition<T, S> {
  name?: string;
}

export interface SuperserialOptions {
  classes?: Record<
    string,
    ConstructType<any> | [
      ConstructType<any>,
      ClassDefinition<any, any>,
    ]
  >;
}

export class Superserial {
  #revivers: Map<string, Reviver<any>> = new Map();
  #reducers: Map<ConstructType<unknown>, Reducer<any>> = new Map();

  constructor({ classes }: SuperserialOptions = {}) {
    this.defineClasses(classes ?? {});
  }

  defineClasses(
    classes: Record<
      string,
      ConstructType<any> | [
        ConstructType<any>,
        ClassDefinition<any, any>,
      ]
    >,
  ) {
    for (const [className, classValue] of Object.entries(classes)) {
      let constructType: ConstructType<any>;
      let reducer: Reducer<any> | null = null;
      let reviver: Reviver<any> | null = null;
      if (Array.isArray(classValue)) {
        constructType = classValue[0];
        const toSerializeFn = classValue[1].toSerialize;
        const toDeserializeFn = classValue[1].toDeserialize;
        if (toSerializeFn) {
          reducer = [className, (value) => [toSerializeFn(value)]];
        }
        if (toDeserializeFn) {
          reviver = (value: any) => toDeserializeFn(value);
        }
      } else {
        constructType = classValue;
        if (toSerialize in classValue.prototype) {
          reducer = [className, (value: any) => [value[toSerialize]()]];
        } else {
          reducer = [className, (value: any) => [{ ...value }]];
        }
        if (toDeserialize in classValue) {
          reviver = (value: any) => (classValue as any)[toDeserialize](value);
        } else {
          reviver = (value: any) =>
            Object.assign(new (classValue as any)(), value);
        }
      }
      if (reducer) {
        this.#reducers.set(constructType, reducer);
      }
      if (reviver) {
        this.#revivers.set(className, reviver);
      }
    }
  }

  defineClass<T, S>(
    constructType: ConstructType<T>,
    classDefinition: DefineClassOptions<T, S>,
  ) {
    this.defineClasses({
      [classDefinition.name ?? constructType.name]: [
        constructType,
        classDefinition,
      ],
    });
  }

  serialize(value: unknown): string {
    return serialize(value, this.#reducers);
  }

  deserialize<T = unknown>(code: string): T {
    return deserialize<T>(code, this.#revivers);
  }
}
