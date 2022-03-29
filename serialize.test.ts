// deno-lint-ignore-file no-explicit-any

import { assertEquals } from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { serialize } from "./serialize.ts";
import { toSerialize } from "./symbol.ts";

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

Deno.test("serialize builtin Map", () => {
  assertEquals(
    serialize(
      new Map<any, any>([
        ["string", "this is string"],
        [true, "boolean"],
        [null, "null"],
        [{}, "object"],
      ]),
    ),
    'Map{"_":$1};[$2,$3,$4,$5];["string","this is string"];[true,"boolean"];[null,"null"];[$6,"object"];{}',
  );
});

Deno.test("serialize builtin Set", () => {
  assertEquals(serialize(new Set([1, 2, 3, 4, 5])), 'Set{"_":$1};[1,2,3,4,5]');
});

Deno.test("serialize builtin Date", () => {
  assertEquals(serialize(new Date(1640962800000)), 'Date{"_":1640962800000}');
});

Deno.test("serialize regex", () => {
  assertEquals(serialize(/abc/), "/abc/");

  assertEquals(serialize(/abc/gmi), "/abc/gim");
});

Deno.test("serialize array", () => {
  assertEquals(serialize([]), "[]");

  assertEquals(
    serialize([[[{}, 2, "", false, []], [[]]], [1, 2], [1]]),
    '[$1,$7,$8];[$2,$5];[$3,2,"",false,$4];{};[];[$6];[];[1,2];[1]',
  );

  assertEquals(
    serialize([{ name: "wan2land" }, { name: "wan3land" }]),
    '[$1,$2];{"name":"wan2land"};{"name":"wan3land"}',
  );

  assertEquals(
    serialize({ users: [{ name: "wan2land" }, { name: "wan3land" }] }),
    '{"users":$1};[$2,$3];{"name":"wan2land"};{"name":"wan3land"}',
  );
});

Deno.test("serialize object", () => {
  assertEquals(serialize({}), "{}");

  assertEquals(
    serialize({ foo: "foo string", und: undefined }),
    '{"foo":"foo string","und":undefined}',
  );
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
  const children = [child1, child2];
  child1.next = child2;
  child1.siblings = children;
  child2.next = child1;
  child2.siblings = children;
  parent.children = children;

  assertEquals(
    serialize(parent),
    '{"children":$1};[$2,$3];{"parent":$0,"next":$3,"siblings":$1};{"parent":$0,"next":$2,"siblings":$1}',
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
