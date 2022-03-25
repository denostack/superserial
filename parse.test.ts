import { assertEquals } from "https://deno.land/std@0.131.0/testing/asserts.ts";
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
