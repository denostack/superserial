// deno-lint-ignore-file no-explicit-any

import { toDeserialize, toSerialize } from "./constants.ts";
import { decoratorHooks, serializableClassMap } from "./decorators/serializable.ts";
import { deserialize, type Reviver } from "./deserialize.ts";
import { type Reducer, serialize } from "./serialize.ts";
import type { ConstructType } from "./types.ts";

export interface ClassDefinition<T, S> {
  type: ConstructType<T>;
  toSerialize?: (value: T) => S;
  toDeserialize?: (value: S) => T;
}

export interface SuperserialOptions {
  classes?: Record<string, ConstructType<any> | ClassDefinition<any, any>>;
  decorator?: boolean;
}

export class Superserial {
  #revivers: Map<string, Reviver<any>> = new Map();
  #reducers: Map<ConstructType<unknown>, Reducer<any>> = new Map();

  constructor({ classes, decorator }: SuperserialOptions = {}) {
    this.defineClasses(classes ?? {});
    if (decorator) {
      this.defineClasses(Object.fromEntries(
        [...serializableClassMap.entries()].map(([classType, options]) =>
          [options.name ?? classType.name, {
            type: classType,
            toSerialize: options.toSerialize,
            toDeserialize: options.toDeserialize,
          }] as const
        ),
      ));
      decoratorHooks.add((classType, options) => {
        this.defineClass(options.name ?? classType.name, {
          type: classType,
          toSerialize: options.toSerialize,
          toDeserialize: options.toDeserialize,
        });
      });
    }
  }

  defineClasses(
    classes: Record<string, ConstructType<any> | ClassDefinition<any, any>>,
  ): void {
    for (const [className, classTypeOrOptions] of Object.entries(classes)) {
      let classType: ConstructType<any>;
      let reducer: Reducer<any> | null = null;
      let reviver: Reviver<any> | null = null;
      if (typeof classTypeOrOptions === "function") {
        classType = classTypeOrOptions;
        reducer = getReducer(className, classType);
        reviver = getReviver(classType);
      } else {
        classType = classTypeOrOptions.type;
        const toSerializeFn = classTypeOrOptions.toSerialize;
        const toDeserializeFn = classTypeOrOptions.toDeserialize;
        reducer = getReducer(className, classType, toSerializeFn);
        reviver = getReviver(classType, toDeserializeFn);
      }
      if (reducer) {
        this.#reducers.set(classType, reducer);
      }
      if (reviver) {
        this.#revivers.set(className, reviver);
      }
    }
  }

  defineClass<T, S>(classType: ConstructType<T>): void;
  defineClass<T, S>(name: string, classType: ConstructType<T>): void;
  defineClass<T, S>(name: string, options: ClassDefinition<T, S>): void;
  defineClass<T, S>(
    nameOrClassType: string | ConstructType<T>,
    optionsOrClassType?: ClassDefinition<T, S> | ConstructType<T>,
  ) {
    if (typeof nameOrClassType === "function") {
      this.defineClasses({ [nameOrClassType.name]: nameOrClassType });
    } else {
      this.defineClasses({ [nameOrClassType]: optionsOrClassType! });
    }
  }

  serialize(value: unknown): string {
    return serialize(value, this.#reducers);
  }

  deserialize<T = unknown>(code: string): T {
    return deserialize<T>(code, this.#revivers);
  }
}

function getReducer(
  className: string,
  classType: ConstructType<any>,
  toSerializeFn?: (value: any) => any,
): Reducer<any> {
  if (toSerializeFn) {
    return [className, (value) => [toSerializeFn(value)]];
  }
  if (toSerialize in classType.prototype) {
    return [className, (value: any) => [value[toSerialize]()]];
  }
  return [className, (value: any) => [{ ...value }]];
}

function getReviver(classType: ConstructType<any>, toDeserializeFn?: (value: any) => any): Reviver<any> {
  if (toDeserializeFn) {
    return (value: any) => toDeserializeFn(value);
  }
  if (toDeserialize in classType) {
    return (value: any) => (classType as any)[toDeserialize](value);
  }
  return (value: any) => Object.assign(new (classType as any)(), value);
}
