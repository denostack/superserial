// deno-lint-ignore-file ban-types no-explicit-any

import { ConstructType } from "./types.ts";

export interface Transformer<TInput, TOutput extends (object | any[])> {
  of: ConstructType<TInput>;
  name?: string;
  serialize?(value: TInput): TOutput;
  deserialize?(value: TOutput): TInput;
}
