import { Serializer } from "./serializer.ts";

const serializer = new Serializer();

Deno.bench("serialize #Serializer.serialize", () => {
  serializer.serialize({
    string: "String",
    number: 1000.0,
    true: true,
    false: false,
    null: null,
    array: [1, 2, 3, 4, 5],
    object: {
      itesm: [{ name: 1 }, { name: 2 }, { name: 3 }],
    },
  });
});

Deno.bench("serialize #JSON.stringify", () => {
  JSON.stringify({
    string: "String",
    number: 1000.0,
    true: true,
    false: false,
    null: null,
    array: [1, 2, 3, 4, 5],
    object: {
      itesm: [{ name: 1 }, { name: 2 }, { name: 3 }],
    },
  });
});

const serialized1 = serializer.serialize({
  string: "String",
  number: 1000.0,
  true: true,
  false: false,
  null: null,
  array: [1, 2, 3, 4, 5],
  object: {
    itesm: [{ name: 1 }, { name: 2 }, { name: 3 }],
  },
});
Deno.bench("serialize #Serializer.deserialize", () => {
  serializer.deserialize(serialized1);
});

const serialized2 = JSON.stringify({
  string: "String",
  number: 1000.0,
  true: true,
  false: false,
  null: null,
  array: [1, 2, 3, 4, 5],
  object: {
    itesm: [{ name: 1 }, { name: 2 }, { name: 3 }],
  },
});
Deno.bench("serialize #JSON.parse", () => {
  JSON.parse(serialized2);
});
