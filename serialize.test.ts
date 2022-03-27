import { assertEquals } from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { serialize } from "./serialize.ts";
import { toDeserialize, toSerialize } from "./symbol.ts";

Deno.test("serialize scalar", () => {
  assertEquals(serialize(null), "null");
  assertEquals(serialize(undefined), "undefined");

  assertEquals(serialize(true), "true");
  assertEquals(serialize(false), "false");

  assertEquals(serialize(30), "30");
  assertEquals(serialize(30.1), "30.1");

  assertEquals(serialize(30n), "30n");
  assertEquals(serialize(-30n), "-30n");
  assertEquals(
    serialize(9007199254740991000000n),
    "9007199254740991000000n",
  );
  assertEquals(
    serialize(-9007199254740991000000n),
    "-9007199254740991000000n",
  );

  assertEquals(serialize("string"), '"string"');
});

Deno.test("serialize extend scalar", () => {
  assertEquals(serialize(NaN), "NaN");
  assertEquals(serialize(Infinity), "Infinity");
  assertEquals(serialize(-Infinity), "-Infinity");
});

Deno.test("serialize regex", () => {
  assertEquals(serialize(/abc/), "/abc/");

  assertEquals(serialize(/abc/gmi), "/abc/gim");
});

Deno.test("serialize object", () => {
  assertEquals(serialize({}), "{}");

  assertEquals(serialize({ foo: "foo string" }), '{"foo":"foo string"}');
  assertEquals(
    serialize({ foo: { bar: "bar string" } }),
    '{"foo":$1};{"bar":"bar string"}',
  );
});

Deno.test("serialize object self circular", () => {
  const selfCircular = {} as any;
  selfCircular.selfCircular = selfCircular;
  assertEquals(serialize(selfCircular), '{"selfCircular":$0}');
});

Deno.test("serialize object circular", () => {
  const parent = {} as any;
  const child1 = { parent } as any;
  const child2 = { parent } as any;
  child1.sibling = child2;
  child2.sibling = child1;
  parent.children = [child1, child2];

  assertEquals(
    serialize(parent),
    '{"children":[$1,$2]};{"parent":$0,"sibling":$2};{"parent":$0,"sibling":$1}',
  );
});

Deno.test("serialize function (not support)", () => {
  assertEquals(serialize(function () {}), "{}");
});

Deno.test("serialize class", () => {
  class TestUser {
    #_privateSomething = 1;
    publicSomething = 2;
    constructor(public name: string, public age: number) {
    }
  }

  const user = new TestUser("wan2land", 20);

  assertEquals(
    serialize(user),
    'TestUser{"name":"wan2land","age":20,"publicSomething":2}',
  );
});

Deno.test("serialize class with private", () => {
  class TestUser {
    #_privateSomething = 1;
    publicSomething = 2;
    constructor(public name: string, public age: number) {
    }

    [toSerialize]() {
      return {
        name: this.name,
        age: this.age,
        publicSomething: this.publicSomething,
        privateSomething: this.#_privateSomething,
      };
    }
  }

  const user = new TestUser("wan2land", 20);

  assertEquals(
    serialize(user),
    'TestUser{"name":"wan2land","age":20,"publicSomething":2,"privateSomething":1}',
  );
});
