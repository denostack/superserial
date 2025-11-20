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

Deno.test("serialize primitive", () => {
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

Deno.test("serialize constants", () => {
  assertEquals(serialize(undefined), "[[1]]");
  assertEquals(serialize(NaN), "[[2]]");
  assertEquals(serialize(Infinity), "[[3]]");
  assertEquals(serialize(-Infinity), "[[4]]");
  assertEquals(serialize(-0), "[[5]]");
});

Deno.test("serialize bigint", () => {
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

Deno.test("serialize array", () => {
  assertEquals(serialize([]), "[[[]]]");
  assertEquals(
    serialize([[[{}, 2, "", false, []], [[]]], [1, 2], [1]]),
    '[[[[0,1],[0,2],[0,3]]],[[[0,4],[0,5]]],[[1,2]],[[1]],[[[0,6],2,"",false,[0,7]]],[[[0,8]]],{},[[]],[[]]]',
  );
});

Deno.test("serialize array self circular", () => {
  const value = [] as unknown[];
  value.push(value);
  assertEquals(serialize(value), "[[[[0,0]]]]");
});

Deno.test("serialize array circular", () => {
  const value = [] as unknown[];
  const otherValue = [] as unknown[];
  value.push(otherValue);
  otherValue.push(value);

  assertEquals(serialize(value), "[[[[0,1]]],[[[0,0]]]]");
});

Deno.test("serialize object", () => {
  assertEquals(serialize({}), "[{}]");
  assertEquals(serialize(function () {}), "[{}]"); // not supported
  assertEquals(serialize(Object.create(null)), "[{}]");

  assertEquals(
    serialize({ foo: "foo string", und: undefined }),
    '[{"foo":"foo string","und":[1]}]',
  );
  assertEquals(
    serialize({ foo: { bar: "bar string" } }),
    '[{"foo":[0,1]},{"bar":"bar string"}]',
  );
});

Deno.test("serialize object self circular", () => {
  const value = {} as { a: unknown };
  value.a = value;
  assertEquals(serialize(value), '[{"a":[0,0]}]');
});

Deno.test("serialize object circular", () => {
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

Deno.test("serialize object with array", () => {
  assertEquals(
    serialize([{ name: "wan2land" }, { name: "wan3land" }]),
    '[[[[0,1],[0,2]]],{"name":"wan2land"},{"name":"wan3land"}]',
  );

  assertEquals(
    serialize({ users: [{ name: "wan2land" }, { name: "wan3land" }] }),
    '[{"users":[0,1]},[[[0,2],[0,3]]],{"name":"wan2land"},{"name":"wan3land"}]',
  );
});

Deno.test("serialize named object without reducer", () => {
  const user = new User("wan2land", 20);

  assertEquals(
    serialize(user),
    '[{"name":"wan2land"}]',
  );
});

Deno.test("serialize named object with empty reducer", () => {
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

Deno.test("serialize named object with reducer", () => {
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
    '[["U",[0,1]],{"name":"wan2land","age":20}]',
  );
});

Deno.test("serialize Symbol", () => {
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
    '[[[[0,1],[0,2],[0,3],[0,4]]],["Symbol"],["Symbol"],["Symbol","superserial"],[[[0,2]]]]',
  );
});

Deno.test("serialize Set", () => {
  assertEquals(
    serialize(new Set([1, 2, 3, 4, 5])),
    '[["Set",1,2,3,4,5]]',
  );
});

Deno.test("serialize Set circular", () => {
  const set = new Set();
  set.add(set);
  assertEquals(serialize(set), '[["Set",[0,0]]]');
});

Deno.test("serialize Map", () => {
  assertEquals(
    serialize(
      new Map<unknown, unknown>([
        ["string", "this is string"],
        [true, "boolean"],
        [null, "null"],
        [{}, "object"],
      ]),
    ),
    '[["Map",[0,1],[0,2],[0,3],[0,4]],[["string","this is string"]],[[true,"boolean"]],[[null,"null"]],[[[0,5],"object"]],{}]',
  );
});

Deno.test("serialize Map deep", () => {
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
    '[["Map",[0,1],[0,2]],[["key1",[0,3]]],[[[0,4],"val2"]],["Map",[0,5],[0,6]],["Map",[0,7],[0,8]],[["key1_1","value1_1"]],[["key1_2","value1_2"]],[["key2_1","value2_1"]],[["key2_2","value2_2"]]]',
  );
});

Deno.test("serialize Map circular", () => {
  {
    const value = new Map<unknown, unknown>();
    value.set(value, value);

    assertEquals(
      serialize(value),
      '[["Map",[0,1]],[[[0,0],[0,0]]]]',
    );
  }
  {
    const value = new Map<unknown, unknown>();
    value.set(value, "val");
    value.set("key", value);

    assertEquals(
      serialize(value),
      '[["Map",[0,1],[0,2]],[[[0,0],"val"]],[["key",[0,0]]]]',
    );
  }
});

Deno.test("serialize Date", () => {
  assertEquals(
    serialize(new Date(1640962800000)),
    '[["Date",1640962800000]]',
  );
});

Deno.test("serialize RegExp", () => {
  assertEquals(serialize(/abc/), '[["RegExp","abc"]]');
  assertEquals(serialize(/abc/gmi), '[["RegExp","abc","gim"]]');
});
