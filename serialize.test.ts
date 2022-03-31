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

Deno.test("serialize symbol", () => {
  assertEquals(serialize(Symbol()), "Symbol()");
  assertEquals(serialize(Symbol("desc1")), 'Symbol("desc1")');

  const symbol1 = Symbol("sym1");
  const symbol2 = Symbol("sym2");
  assertEquals(
    serialize([symbol1, symbol2, Symbol("sym1"), [symbol2]]),
    '[$1,$2,$3,$4];Symbol("sym1");Symbol("sym2");Symbol("sym1");[$2]',
  );
});

Deno.test("serialize built-in Set", () => {
  assertEquals(serialize(new Set([1, 2, 3, 4, 5])), "Set(1,2,3,4,5)");
});

Deno.test("serialize built-in Set circular", () => {
  const set = new Set();
  set.add(set);
  assertEquals(serialize(set), "Set($0)");
});

Deno.test("serialize built-in Map", () => {
  assertEquals(
    serialize(
      new Map<any, any>([
        ["string", "this is string"],
        [true, "boolean"],
        [null, "null"],
        [{}, "object"],
      ]),
    ),
    'Map("string"=>"this is string",true=>"boolean",null=>"null",$1=>"object");{}',
  );
});

Deno.test("serialize build-in Map deep", () => {
  const map1 = new Map([["key1_1", "value1_1"], ["key1_2", "value1_2"]]);
  const map2 = new Map([["key2_1", "value2_1"], ["key2_2", "value2_2"]]);

  assertEquals(
    serialize(
      new Map<any, any>([["key1", map1] as const, [map2, "val2"] as const]),
    ),
    'Map("key1"=>$1,$2=>"val2");Map("key1_1"=>"value1_1","key1_2"=>"value1_2");Map("key2_1"=>"value2_1","key2_2"=>"value2_2")',
  );
});

Deno.test("serialize build-in Map circular", () => {
  const map1 = new Map<any, any>();
  map1.set(map1, map1);

  assertEquals(
    serialize(map1),
    "Map($0=>$0)",
  );

  const map2 = new Map<any, any>();
  map2.set(map2, "val");
  map2.set("key", map2);

  assertEquals(
    serialize(map2),
    'Map($0=>"val","key"=>$0)',
  );
});

Deno.test("serialize built-in Date", () => {
  assertEquals(serialize(new Date(1640962800000)), "Date(1640962800000)");
});

Deno.test("serialize regex", () => {
  assertEquals(serialize(/abc/), "/abc/");

  assertEquals(serialize(/abc/gmi), "/abc/gim");
});

Deno.test("serialize array", () => {
  assertEquals(serialize([]), "[]");

  assertEquals(
    serialize([[[{}, 2, "", false, []], [[]]], [1, 2], [1]]),
    '[$1,$2,$3];[$4,$5];[1,2];[1];[$6,2,"",false,$7];[$8];{};[];[]',
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
