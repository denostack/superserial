import { serialize as serializeCandidate } from "../serialize_candidate.ts";
import { serialize } from "../serialize.ts";

const origin = {
  string: "String",
  number: 1000.0,
  true: true,
  false: false,
  null: null,
  array: [1, 2, 3, 4, 5],
  object: {
    items: [{ name: 1 }, { name: 2 }, { name: 3 }],
  },
  object2: {
    object3: {
      array: [] as any[],
    },
    set: new Set([
      1,
      2,
      3,
      4,
      {},
      new Map<any, any>([
        [new Set([1, 2, 3, 4, 5]), "-_-"],
        [
          "-_-",
          new Set([1, 2, 3, 4, 5]),
        ],
        [new Set([1, 2, 3, 4, 5]), "-_-"],
      ]),
    ]),
  },
};
origin.object2.object3.array.push(origin.object2.set);

Deno.bench({
  name: "serialize",
  baseline: true,
  group: "serialize",
  fn: () => {
    serialize(origin);
  },
});

Deno.bench({
  name: "serialize (candidate)",
  group: "serialize",
  fn: () => {
    serializeCandidate(origin);
  },
});
