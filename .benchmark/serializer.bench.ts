import { Serializer } from "../serializer.ts";

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
};

const serializer = new Serializer();

Deno.bench({
  name: "serialize #Serializer.serialize",
  baseline: true,
  group: "serialize",
  fn: () => {
    serializer.serialize(origin);
  },
});

Deno.bench({
  name: "serialize #JSON.stringify",
  group: "serialize",
  fn: () => {
    JSON.stringify(origin);
  },
});

const serialized1 = serializer.serialize(origin);
Deno.bench({
  name: "serialize #Serializer.deserialize",
  baseline: true,
  group: "deserialize",
  fn: () => {
    serializer.deserialize(serialized1);
  },
});

const serialized2 = JSON.stringify(origin);
Deno.bench({
  name: "serialize #JSON.parse",
  group: "deserialize",
  fn: () => {
    JSON.parse(serialized2);
  },
});
