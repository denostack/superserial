import { assertEquals, assertStrictEquals } from "@std/assert";
import { serialize } from "./serialize.ts";

class User {
  name: string;
  #age: number;
  constructor(name: string, age: number) {
    this.name = name;
    this.#age = age;
  }
  getAge() {
    return this.#age;
  }
}

class EmptyUser {
}

Deno.test("serialize - handles primitives", () => {
  assertStrictEquals(serialize(null), "[null]");

  assertStrictEquals(serialize(true), "[true]");
  assertStrictEquals(serialize(false), "[false]");

  assertStrictEquals(serialize(0), "[0]");
  assertStrictEquals(serialize(12345), "[12345]");
  assertStrictEquals(serialize(12345.678), "[12345.678]");
  assertStrictEquals(serialize(-12345), "[-12345]");
  assertStrictEquals(serialize(-12345.678), "[-12345.678]");

  assertStrictEquals(serialize("string!"), '["string!"]');

  assertStrictEquals(serialize("\\"), '["\\\\"]');
  assertStrictEquals(serialize("\\x00"), '["\\\\x00"]');
  assertStrictEquals(serialize("\x00"), '["\\u0000"]');
});

Deno.test("serialize - handles constants", () => {
  assertEquals(serialize(undefined), "[[1]]");
  assertEquals(serialize(NaN), "[[2]]");
  assertEquals(serialize(Infinity), "[[3]]");
  assertEquals(serialize(-Infinity), "[[4]]");
  assertEquals(serialize(-0), "[[5]]");
});

Deno.test("serialize - handles BigInts", () => {
  assertEquals(serialize(30n), '[["BigInt","30"]]');
  assertEquals(serialize(-30n), '[["BigInt","-30"]]');
  assertEquals(
    serialize(9007199254740991000000n),
    '[["BigInt","9007199254740991000000"]]',
  );
  assertEquals(
    serialize(-9007199254740991000000n),
    '[["BigInt","-9007199254740991000000"]]',
  );
});

Deno.test("serialize - handles arrays", () => {
  assertEquals(serialize([]), "[[[]]]");
  assertEquals(
    serialize([[[{}, 2, "", false, []], [[]]], [1, 2], [1]]),
    '[[[[[[[{},2,"",false,[[]]]],[[[[]]]]]],[[1,2]],[[1]]]]]',
  );
});

Deno.test("serialize - handles self-circular arrays", () => {
  const value = [] as unknown[];
  value.push(value);
  assertEquals(serialize(value), "[[[[0,0]]]]");
});

Deno.test("serialize - handles circular reference in arrays", () => {
  const value = [] as unknown[];
  const otherValue = [] as unknown[];
  value.push(otherValue);
  otherValue.push(value);

  assertEquals(serialize(value), "[[[[[[0,0]]]]]]");
});

Deno.test("serialize - handles plain objects", () => {
  assertEquals(serialize({}), "[{}]");
  assertEquals(serialize(function () {}), "[{}]"); // not supported
  assertEquals(serialize(Object.create(null)), "[{}]");

  assertEquals(
    serialize({ foo: "foo string", und: undefined }),
    '[{"foo":"foo string","und":[1]}]',
  );
  assertEquals(
    serialize({ foo: { bar: "bar string" } }),
    '[{"foo":{"bar":"bar string"}}]',
  );
});

Deno.test("serialize - handles self-circular objects", () => {
  const value = {} as { a: unknown };
  value.a = value;
  assertEquals(serialize(value), '[{"a":[0,0]}]');
});

Deno.test("serialize - handles circular reference in objects", () => {
  const parent = {} as { children: unknown[] };
  const child1 = { parent } as {
    parent: unknown;
    next: unknown;
    siblings: unknown[];
  };
  const child2 = { parent } as {
    parent: unknown;
    next: unknown;
    siblings: unknown[];
  };
  const children = [child1, child2];
  child1.next = child2;
  child1.siblings = children;
  child2.next = child1;
  child2.siblings = children;
  parent.children = children;

  assertEquals(
    serialize(parent),
    '[{"children":[0,1]},[[[0,2],[0,3]]],{"parent":[0,0],"next":[0,3],"siblings":[0,1]},{"parent":[0,0],"next":[0,2],"siblings":[0,1]}]',
  );
});

Deno.test("serialize - handles objects with embedded arrays", () => {
  assertEquals(
    serialize([{ name: "wan2land" }, { name: "wan3land" }]),
    '[[[{"name":"wan2land"},{"name":"wan3land"}]]]',
  );

  assertEquals(
    serialize({ users: [{ name: "wan2land" }, { name: "wan3land" }] }),
    '[{"users":[[{"name":"wan2land"},{"name":"wan3land"}]]}]',
  );
});

Deno.test("serialize - handles named objects without reducer", () => {
  const user = new User("wan2land", 20);

  assertEquals(
    serialize(user),
    '[{"name":"wan2land"}]',
  );
});

Deno.test("serialize - handles named objects with empty reducer", () => {
  const user = new EmptyUser();

  assertEquals(
    serialize(
      user,
      new Map([[EmptyUser, [
        "Eu",
      ]]]),
    ),
    '[["Eu"]]',
  );
});

Deno.test("serialize - handles named objects with custom reducer", () => {
  const user = new User("wan2land", 20);
  assertEquals(
    serialize(
      user,
      new Map([[User, [
        "U",
        (
          value: User,
        ) => [{ name: value.name, age: value.getAge() }],
      ]]]),
    ),
    '[["U",{"name":"wan2land","age":20}]]',
  );
});

Deno.test("serialize - handles Symbols", () => {
  assertEquals(serialize(Symbol()), '[["Symbol"]]');
  assertEquals(serialize(Symbol("desc1")), '[["Symbol"]]');
  assertEquals(
    serialize(Symbol.for("superserial")),
    '[["Symbol","superserial"]]',
  );

  const symbol1 = Symbol("sym1");
  const symbol2 = Symbol("sym2");
  assertEquals(
    serialize([symbol1, symbol2, Symbol.for("superserial"), [symbol2]]),
    '[[[["Symbol"],[0,1],["Symbol","superserial"],[[[0,1]]]]],["Symbol"]]',
  );
});

Deno.test("serialize - handles Sets", () => {
  assertEquals(
    serialize(new Set([1, 2, 3, 4, 5])),
    '[["Set",1,2,3,4,5]]',
  );
});

Deno.test("serialize - handles circular reference in Sets", () => {
  const set = new Set();
  set.add(set);
  assertEquals(serialize(set), '[["Set",[0,0]]]');
});

Deno.test("serialize - handles Maps", () => {
  assertEquals(
    serialize(
      new Map<unknown, unknown>([
        ["string", "this is string"],
        [true, "boolean"],
        [null, "null"],
        [{}, "object"],
      ]),
    ),
    '[["Map",[["string","this is string"]],[[true,"boolean"]],[[null,"null"]],[[{},"object"]]]]',
  );
});

Deno.test("serialize - handles deep Maps", () => {
  assertEquals(
    serialize(
      new Map<unknown, unknown>([
        [
          "key1",
          new Map([["key1_1", "value1_1"], ["key1_2", "value1_2"]]),
        ] as const,
        [
          new Map([["key2_1", "value2_1"], ["key2_2", "value2_2"]]),
          "val2",
        ] as const,
      ]),
    ),
    '[["Map",[["key1",["Map",[["key1_1","value1_1"]],[["key1_2","value1_2"]]]]],[[["Map",[["key2_1","value2_1"]],[["key2_2","value2_2"]]],"val2"]]]]',
  );
});

Deno.test("serialize - handles circular reference in Maps", () => {
  {
    const value = new Map<unknown, unknown>();
    value.set(value, value);

    assertEquals(
      serialize(value),
      '[["Map",[[[0,0],[0,0]]]]]',
    );
  }
  {
    const value = new Map<unknown, unknown>();
    value.set(value, "val");
    value.set("key", value);

    assertEquals(
      serialize(value),
      '[["Map",[[[0,0],"val"]],[["key",[0,0]]]]]',
    );
  }
});

Deno.test("serialize - handles Dates", () => {
  assertEquals(
    serialize(new Date(1640962800000)),
    '[["Date",1640962800000]]',
  );
});

Deno.test("serialize - handles Regular Expressions", () => {
  assertEquals(serialize(/abc/), '[["RegExp","abc"]]');
  assertEquals(serialize(/abc/gmi), '[["RegExp","abc","gim"]]');
});
