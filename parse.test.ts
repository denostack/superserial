import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { assertSpyCall, spy } from "https://deno.land/x/mock@0.15.0/mod.ts";

import { parse } from "./parse.ts";

Deno.test("parse scalar", () => {
  assertEquals(parse("null"), null);
  // assertEquals(parse("undefined"), undefined);

  // assertEquals(parse("true"), true);
  // assertEquals(parse("false"), false);

  // assertEquals(parse("30"), 30);
  // assertEquals(parse("30.1"), 30.1);

  // assertEquals(parse("30n"), 30n);
  // assertEquals(parse("-30n"), -30n);
  // assertEquals(parse("9007199254740991000000n"), 9007199254740991000000n);
  // assertEquals(parse("-9007199254740991000000n"), -9007199254740991000000n);

  // assertEquals(parse('"string"'), "string");
});

Deno.test("parse extend scalar", () => {
  assertEquals(parse("NaN"), NaN);
  assertEquals(parse("Infinity"), Infinity);
  assertEquals(parse("-Infinity"), -Infinity);
});

Deno.test("parse regex", () => {
  assertEquals(parse("/abc/"), /abc/);

  assertEquals(parse("/abc/gmi"), /abc/gmi);
  assertEquals(parse("/abc/gim"), /abc/gmi);
  assertEquals(parse("/abc/mgi"), /abc/gmi);
  assertEquals(parse("/abc/mig"), /abc/gmi);
  assertEquals(parse("/abc/img"), /abc/gmi);
  assertEquals(parse("/abc/igm"), /abc/gmi);
});

Deno.test("parse object", () => {
  assertEquals(parse("{}"), {});

  assertEquals(parse('{ "foo": "foo string" }'), {
    "foo": "foo string",
  });

  assertEquals(
    parse('{"string":$1,"true":$2,"false":$3};"string";true;false'),
    { string: "string", true: true, false: false },
  );
});

Deno.test("parse object self circular", () => {
  const result = parse('{"boolean":false,"self":$0}');

  assertEquals(result.boolean, false);
  assertStrictEquals(result.self, result);
});

Deno.test("parse object circular", () => {
  const result = parse(
    '{"children":[$1,$2]};{"parent":$0,"sibling":$2};{"parent":$0,"sibling":$1}',
  );

  assertStrictEquals(result.children[0].parent, result);
  assertStrictEquals(result.children[1].parent, result);

  assertStrictEquals(result.children[0].sibling, result.children[1]);
  assertStrictEquals(result.children[1].sibling, result.children[0]);
});

Deno.test("parse class without define", () => {
  const spyConsole = spy(console, "warn");

  assertEquals(
    parse(
      'TestUser{"name":"wan2land","age":20,"publicSomething":2}',
    ),
    {
      name: "wan2land",
      age: 20,
      publicSomething: 2,
    },
  );

  assertSpyCall(
    spyConsole,
    0,
    {
      args: [
        "Class TestUser is not defined. It will be ignored.",
      ],
    },
  );

  spyConsole.restore();
});

Deno.test("parse class", () => {
  class TestUser {
    #_privateSomething = 1;
    publicSomething = 2;
    constructor(public name: string, public age: number) {
    }

    get privateSomething() {
      return this.#_privateSomething;
    }

    set privateSomething(value: number) {
      this.#_privateSomething = value;
    }
  }

  const spyConsole = spy(console, "warn");

  const parsed = parse(
    'TestUser{"name":"wan2land","age":20,"publicSomething":2}',
    { mapClasses: { TestUser } },
  );

  assertEquals(parsed, new TestUser("wan2land", 20));
  assertEquals(parsed instanceof TestUser, true);

  assertEquals(spyConsole.calls.length, 0);

  spyConsole.restore();
});
