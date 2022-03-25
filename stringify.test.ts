import { assertEquals } from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { stringify } from "./stringify.ts";

Deno.test("stringify scalar", () => {
  assertEquals(stringify(null), "null");

  assertEquals(stringify(true), "true");
  assertEquals(stringify(false), "false");

  assertEquals(stringify(30), "30");
  assertEquals(stringify(30.1), "30.1");

  assertEquals(stringify(30n), "30n");
  assertEquals(stringify(-30n), "-30n");
  assertEquals(
    stringify(9007199254740991000000n),
    "9007199254740991000000n",
  );
  assertEquals(
    stringify(-9007199254740991000000n),
    "-9007199254740991000000n",
  );

  assertEquals(stringify("string"), '"string"');
});

Deno.test("stringify extend scalar", () => {
  assertEquals(stringify(NaN), "NaN");
  assertEquals(stringify(Infinity), "Infinity");
  assertEquals(stringify(-Infinity), "-Infinity");
});

Deno.test("stringify regex", () => {
  assertEquals(stringify(/abc/), "/abc/");

  assertEquals(stringify(/abc/gmi), "/abc/gim");
});

Deno.test("stringify object", () => {
  assertEquals(stringify({}), "{}");

  assertEquals(stringify({ foo: "foo string" }), '{"foo":"foo string"}');
});

Deno.test("stringify object self circular", () => {
  const selfCircular = {} as any;
  selfCircular.selfCircular = selfCircular;
  assertEquals(stringify(selfCircular), '{"selfCircular":$0}');
});

Deno.test("stringify object circular", () => {
  const parent = {} as any;
  const child1 = { parent } as any;
  const child2 = { parent } as any;
  child1.sibling = child2;
  child2.sibling = child1;
  parent.children = [child1, child2];

  assertEquals(
    stringify(parent),
    '{"children":[$1,$2]};{"parent":$0,"sibling":$2};{"parent":$0,"sibling":$1}',
  );
});
