import { Serializer } from "../serializer.ts";
import * as devalue from "npm:devalue@4.2.2";
import * as flatted from "npm:flatted@3.2.7";
import * as superjson from "npm:superjson@1.12.2";

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

Deno.bench({
  name: "serialize #devalue.stringify",
  group: "serialize",
  fn: () => {
    devalue.stringify(origin);
  },
});

Deno.bench({
  name: "serialize #flatted.stringify",
  group: "serialize",
  fn: () => {
    flatted.stringify(origin);
  },
});

Deno.bench({
  name: "serialize #superjson.stringify",
  group: "serialize",
  fn: () => {
    superjson.stringify(origin);
  },
});

const serializedSuperserial = serializer.serialize(origin);
Deno.bench({
  name: "serialize #Serializer.deserialize",
  baseline: true,
  group: "deserialize",
  fn: () => {
    serializer.deserialize(serializedSuperserial);
  },
});

const serializedJson = JSON.stringify(origin);
Deno.bench({
  name: "serialize #JSON.parse",
  group: "deserialize",
  fn: () => {
    JSON.parse(serializedJson);
  },
});

const serializedDevalue = devalue.stringify(origin);
Deno.bench({
  name: "serialize #devalue.parse",
  group: "deserialize",
  fn: () => {
    devalue.parse(serializedDevalue);
  },
});

const serializedFlatted = flatted.stringify(origin);
Deno.bench({
  name: "serialize #flatted.parse",
  group: "deserialize",
  fn: () => {
    flatted.parse(serializedFlatted);
  },
});

const serializedSuperjson = superjson.stringify(origin);
Deno.bench({
  name: "serialize #superjson.parse",
  group: "deserialize",
  fn: () => {
    superjson.parse(serializedSuperjson);
  },
});
