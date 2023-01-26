// deno-lint-ignore ban-types
export type ConstructType<T> = (new (...args: unknown[]) => T) | Function;
