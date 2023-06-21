// deno-lint-ignore-file no-explicit-any

import { Transformer } from "./transformer.ts";

export const builtInTransformers: Transformer<any, any>[] = [
  {
    of: Date,
    name: "Date",
    serialize(value: Date) {
      return [value.getTime()]; // new Date(timestamp)
    },
    deserialize(value: [ts: number]) {
      return new Date(value[0]);
    },
  } satisfies Transformer<Date, [ts: number]>,
  {
    of: Set,
    name: "Set",
    serialize(value: Set<unknown>) {
      return [...value];
    },
    deserialize(value: unknown[]) {
      return new Set(value);
    },
  } satisfies Transformer<Set<unknown>, unknown[]>,
  // ],
  // [Set, {
  //   name: "Set",
  //   serialize(value: Set<unknown>) {
  //     return [...value];
  //   },
  // }],
  // [Map, {
  //   name: "Map",
  //   serialize(value: Set<unknown>) {
  //     return [...value.entries()].flatMap((v) => v);
  //   },
  // }],
];

export const builtInTransformersMap = new Map<any, Transformer<any, any>>(
  builtInTransformers.map((v) => [v.of, v]),
);
