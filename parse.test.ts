import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { stringify } from "./stringify.ts";
import { parse } from "./parse.ts";

Deno.test("parse scalar", () => {
  assertEquals(parse(stringify(null)), null);

  assertEquals(parse(stringify(true)), true);
  assertEquals(parse(stringify(false)), false);

  assertEquals(parse(stringify(30)), 30);
  assertEquals(parse(stringify(30.1)), 30.1);

  assertEquals(parse(stringify("string")), "string");
});

Deno.test("parse extend scalar", () => {
  assertEquals(parse(stringify(NaN)), NaN);
  assertEquals(parse(stringify(Infinity)), Infinity);
  assertEquals(parse(stringify(-Infinity)), -Infinity);
});

Deno.test("parse regex", () => {
  assertEquals(parse(stringify(/abc/)), /abc/);

  assertEquals(parse(stringify(/abc/gmi)), /abc/gmi);
});

Deno.test("parse object", () => {
  assertEquals(parse(stringify({})), {});

  assertEquals(parse(stringify({ foo: "foo string" })), {
    "foo": "foo string",
  });
});

Deno.test("parse object self circular", () => {
  const circular = { boolean: false } as any;
  circular.self = circular;

  const result = parse(stringify(circular));

  assertEquals(result.boolean, false);
  assertStrictEquals(result.self, result);
});

Deno.test("parse object circular", () => {
  const parent = {} as any;
  const child1 = { parent } as any;
  const child2 = { parent } as any;
  child1.sibling = child2;
  child2.sibling = child1;
  parent.children = [child1, child2];

  const result = parse(stringify(parent));

  assertStrictEquals(result.children[0].parent, result);
  assertStrictEquals(result.children[1].parent, result);

  assertStrictEquals(result.children[0].sibling, result.children[1]);
  assertStrictEquals(result.children[1].sibling, result.children[0]);
});
