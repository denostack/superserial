import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertNotStrictEquals,
  assertStrictEquals,
} from "@std/assert";
import { deserialize } from "./deserialize.ts";
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

Deno.test("deserialize values(primitive, constants, bigint)", () => {
  const values = [
    // null
    null,

    // boolean
    true,
    false,

    // number
    0,
    12345,
    12345.678,
    -12345,
    -12345.678,

    // string
    "string!",
    "\\",
    "\\x00",
    "\x00",

    // constants
    undefined,
    NaN,
    Infinity,
    -Infinity,
    -0,

    // bigint
    30n,
    -30n,
    9007199254740991000000n,
    -9007199254740991000000n,
  ];

  for (const value of values) {
    assertStrictEquals(deserialize(serialize(value)), value);
  }
});

Deno.test("deserialize array", () => {
  assertEquals(deserialize(serialize([])), []);
  assertEquals(
    deserialize(serialize([[[{}, 2, "", false, []], [[]]], [1, 2], [1]])),
    [[[{}, 2, "", false, []], [[]]], [1, 2], [1]],
  );
});

Deno.test("deserialize array self circular", () => {
  const value = deserialize<unknown[]>("[[[[0,0]]]]");
  assertStrictEquals(value, value[0]);
});

Deno.test("deserialize array circular", () => {
  const value = deserialize<unknown[]>(
    "[[[[0,1]]],[[[0,0]]]]",
  );
  const otherValue = value[0] as unknown[];

  assertEquals(value.length, 1);
  assertEquals(otherValue.length, 1);

  assertStrictEquals(value[0], otherValue);
  assertStrictEquals(otherValue[0], value);
});

Deno.test("deserialize object", () => {
  assertEquals(deserialize(serialize({})), {});

  {
    const obj = deserialize<Record<string, unknown>>(
      serialize({ foo: "foo string", und: undefined }),
    );
    assert("und" in obj);
    assertEquals(obj, { foo: "foo string", und: undefined });
  }
  {
    const obj = deserialize(serialize({ foo: { bar: "bar string" } }));
    assertEquals(obj, { foo: { bar: "bar string" } });
  }
});

Deno.test("deserialize object self circular", () => {
  const value = deserialize<{ a: unknown }>('[{"a":[0,0]}]');
  assertStrictEquals(value.a, value);
});

Deno.test("deserialize object circular", () => {
  const value = deserialize<
    { children: { parent: unknown; next: unknown }[] }
  >('[{"children":[0,1]},[[[0,2],[0,3]]],{"parent":[0,0],"next":[0,3],"siblings":[0,1]},{"parent":[0,0],"next":[0,2],"siblings":[0,1]}]');

  assertEquals(Object.keys(value), ["children"]);
  assertEquals(value.children.length, 2);
  assertEquals(Object.keys(value.children[0]), ["parent", "next", "siblings"]);
  assertEquals(Object.keys(value.children[1]), ["parent", "next", "siblings"]);

  assertStrictEquals(value.children[0].parent, value);
  assertStrictEquals(value.children[1].parent, value);

  assertStrictEquals(value.children[0].next, value.children[1]);
  assertStrictEquals(value.children[1].next, value.children[0]);
});

Deno.test("deserialize object with array", () => {
  assertEquals(
    deserialize(serialize([{ name: "wan2land" }, { name: "wan3land" }])),
    [{ name: "wan2land" }, { name: "wan3land" }],
  );

  assertEquals(
    deserialize(
      serialize(
        { users: [{ name: "wan2land" }, { name: "wan3land" }] },
      ),
    ),
    { users: [{ name: "wan2land" }, { name: "wan3land" }] },
  );
});

Deno.test("deserialize named object without reviver", () => {
  const value = deserialize<object>(
    '[["U",[0,1]],{"name":"wan2land","age":20}]',
  );

  assertStrictEquals(value.constructor, Object);
  assertEquals(value, { "name": "wan2land", "age": 20 });
});

Deno.test("deserialize named object with empty reviver", () => {
  const value = deserialize(
    '[["Eu"]]',
    new Map([["Eu", () => new EmptyUser()]]),
  );

  assertInstanceOf(value, EmptyUser);
  assertEquals(Object.keys(value), []);
});

Deno.test("deserialize named object with reviver", () => {
  const value = deserialize<User>(
    '[["U",[0,1]],{"name":"wan2land","age":20}]',
    new Map([
      ["U", (value: { name: string; age: number }) => {
        return new User(value.name, value.age);
      }],
    ]),
  );
  assertInstanceOf(value, User);

  assertEquals(value.name, "wan2land");
  assertEquals(value.getAge(), 20);
});

Deno.test("deserialize symbol", () => {
  {
    const symbol = deserialize<symbol>('[["Symbol"]]');
    assertEquals(typeof symbol, "symbol");
    assertEquals(symbol.description, undefined);
  }
  {
    const symbol = deserialize<symbol>('[["Symbol","superserial"]]');
    assertStrictEquals(symbol, Symbol.for("superserial"));
  }
  {
    const symbol1 = Symbol("sym1");
    const symbol2 = Symbol("sym2");
    const value = deserialize<[symbol, symbol, symbol, [symbol]]>(
      serialize([symbol1, symbol2, Symbol.for("superserial"), [symbol2]]),
    );
    assertNotStrictEquals(value[0], value[1]);
    assertNotStrictEquals(value[0], value[2]);
    assertStrictEquals(value[1], value[3][0]);
    assertStrictEquals(value[2], Symbol.for("superserial"));
  }
});

Deno.test("deserialize Set", () => {
  assertEquals(
    deserialize(serialize(new Set([1, 2, 3, 4, 5]))),
    new Set([1, 2, 3, 4, 5]),
  );
});

Deno.test("deserialize Set circular", () => {
  function createSet() {
    const set = new Set();
    set.add(set);
    return set;
  }

  const set = deserialize<Set<unknown>>(serialize(createSet()));
  assertEquals(set.size, 1);
  assertStrictEquals(
    set,
    [...set][0],
  );
});

Deno.test("deserialize Map", () => {
  function createMap() {
    return new Map<unknown, unknown>([
      ["string", "this is string"],
      [true, "boolean"],
      [null, "null"],
      [{}, "object"],
    ]);
  }

  assertEquals(deserialize(serialize(createMap())), createMap());
});

Deno.test("deserialize Map deep", () => {
  function createMap() {
    return new Map<unknown, unknown>([
      [
        "key1",
        new Map([["key1_1", "value1_1"], ["key1_2", "value1_2"]]),
      ] as const,
      [
        new Map([["key2_1", "value2_1"], ["key2_2", "value2_2"]]),
        "val2",
      ] as const,
    ]);
  }

  assertEquals(deserialize(serialize(createMap())), createMap());
});

Deno.test("deserialize Map circular", () => {
  {
    const createMap = () => {
      const value = new Map<unknown, unknown>();
      value.set(value, value);
      return value;
    };

    const map = deserialize(serialize(createMap())) as Map<
      unknown,
      unknown
    >;
    const keys = [...map.keys()];
    assertEquals(keys.length, 1);
    assertStrictEquals(keys[0], map);
    assertStrictEquals(map.get(map), map);
  }
  {
    const createMap = () => {
      const value = new Map<unknown, unknown>();
      value.set(value, "val");
      value.set("key", value);
      return value;
    };
    const map2 = deserialize(serialize(createMap())) as Map<
      unknown,
      unknown
    >;
    const keys2 = [...map2.keys()];
    assertEquals(keys2.length, 2);
    assertStrictEquals(map2.get(map2), "val");
    assertStrictEquals(map2.get("key"), map2);
  }
});

Deno.test("deserialize Date", () => {
  assertEquals(
    deserialize(serialize(new Date(1640962800000))),
    new Date(1640962800000),
  );
});

Deno.test("deserialize RegExp", () => {
  const re1 = deserialize<RegExp>(serialize(/abc/));
  assertEquals(re1.source, "abc");
  assertEquals(re1.flags, "");

  const re2 = deserialize<RegExp>(serialize(/abc/gmi));
  assertEquals(re2.source, "abc");
  assertEquals(re2.flags, "gim");
});
