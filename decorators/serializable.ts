// deno-lint-ignore-file no-explicit-any

import type { ClassDecorator, ConstructType } from "../types.ts";

export interface SerializableOptions<T, S> {
  name?: string;
  toSerialize?: (value: T) => S;
  toDeserialize?: (value: S) => T;
}

export const serializableClassMap = new Map<ConstructType<unknown>, SerializableOptions<unknown, unknown>>();
export const decoratorHooks = new Set<
  (classType: ConstructType<unknown>, options: SerializableOptions<unknown, unknown>) => void
>();

export function Serializable<T, S>(): ClassDecorator;
export function Serializable<T, S>(name: string): ClassDecorator;
export function Serializable<T, S>(options: SerializableOptions<T, S>): ClassDecorator;
export function Serializable(
  nameOrOptions?: string | SerializableOptions<unknown, unknown>,
): ClassDecorator {
  return serializable(nameOrOptions as any);
}

export function serializable<T, S>(): ClassDecorator;
export function serializable<T, S>(name: string): ClassDecorator;
export function serializable<T, S>(options: SerializableOptions<T, S>): ClassDecorator;
export function serializable(nameOrOptions?: string | SerializableOptions<unknown, unknown>): ClassDecorator {
  return (target: ConstructType<unknown>) => {
    const options: SerializableOptions<unknown, unknown> = !nameOrOptions
      ? {}
      : typeof nameOrOptions === "string"
      ? { name: nameOrOptions }
      : nameOrOptions;
    serializableClassMap.set(target, options);
    decoratorHooks.forEach((hook) => hook(target, options));
  };
}
