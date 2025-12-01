// deno-lint-ignore-file no-import-prefix

import * as devalue from "npm:devalue@5.5.0";
import * as flatted from "npm:flatted@3.2.7";
import * as superjson from "npm:superjson@1.12.2";
import { Superserial } from "../mod.ts";
import { complex, simple } from "./variables.ts";

const superserial = new Superserial();

for (
  const { name, value } of [
    { value: simple, name: "simple" },
    { value: complex, name: "complex" },
  ]
) {
  Deno.bench({
    group: `serialize ${name}`,
    baseline: true,
    name: "Superserial.serialize",
    fn: () => {
      superserial.serialize(value);
    },
  });

  Deno.bench({
    group: `serialize ${name}`,
    name: "JSON.stringify",
    ignore: name === "complex",
    fn: () => {
      JSON.stringify(value);
    },
  });

  Deno.bench({
    group: `serialize ${name}`,
    name: "devalue.stringify",
    fn: () => {
      devalue.stringify(value);
    },
  });

  Deno.bench({
    group: `serialize ${name}`,
    name: "flatted.stringify",
    ignore: name === "complex",
    fn: () => {
      flatted.stringify(value);
    },
  });

  Deno.bench({
    group: `serialize ${name}`,
    name: "superjson.stringify",
    ignore: name === "complex",
    fn: () => {
      superjson.stringify(value);
    },
  });

  const serializedSuperserial = superserial.serialize(value);
  Deno.bench({
    group: `deserialize ${name}`,
    baseline: true,
    name: "Superserial.deserialize",
    fn: () => {
      superserial.deserialize(serializedSuperserial);
    },
  });

  const serializedJson = JSON.stringify(name === "complex" ? {} : value);
  Deno.bench({
    group: `deserialize ${name}`,
    name: "JSON.parse",
    ignore: name === "complex",
    fn: () => {
      JSON.parse(serializedJson);
    },
  });

  const serializedDevalue = devalue.stringify(value);
  Deno.bench({
    group: `deserialize ${name}`,
    name: "devalue.parse",
    fn: () => {
      devalue.parse(serializedDevalue);
    },
  });

  const serializedFlatted = flatted.stringify(name === "complex" ? {} : value);
  Deno.bench({
    group: `deserialize ${name}`,
    name: "flatted.parse",
    ignore: name === "complex",
    fn: () => {
      flatted.parse(serializedFlatted);
    },
  });

  const serializedSuperjson = superjson.stringify(
    name === "complex" ? {} : value,
  );
  Deno.bench({
    group: `deserialize ${name}`,
    name: "superjson.parse",
    ignore: name === "complex",
    fn: () => {
      superjson.parse(serializedSuperjson);
    },
  });
}
