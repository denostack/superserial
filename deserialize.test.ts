import {
  assertEquals,
  assertInstanceOf,
  assertNotStrictEquals,
  assertStrictEquals,
} from "@std/assert";
import { assertSpyCall, spy } from "@std/testing/mock";

import { deserialize } from "./deserialize.ts";
import { toDeserialize } from "./symbol.ts";

Deno.test("deserialize scalar", () => {
  assertEquals(deserialize("null"), null);
  assertEquals(deserialize("undefined"), undefined);

  assertEquals(deserialize("true"), true);
  assertEquals(deserialize("false"), false);

  assertEquals(deserialize("30"), 30);
  assertEquals(deserialize("30.1"), 30.1);

  assertEquals(deserialize("30n"), 30n);
  assertEquals(deserialize("-30n"), -30n);
  assertEquals(deserialize("9007199254740991000000n"), 9007199254740991000000n);
  assertEquals(
    deserialize("-9007199254740991000000n"),
    -9007199254740991000000n,
  );

  assertEquals(deserialize('"string"'), "string");
});

Deno.test("deserialize string with escape", () => {
  assertEquals(deserialize('"\\\\"'), "\\");
  assertEquals(deserialize('"\\\\x00"'), "\\x00");
  assertEquals(deserialize('"\\u0000"'), "\x00");
});

Deno.test("deserialize extend scalar", () => {
  assertEquals(deserialize("NaN"), NaN);
  assertEquals(deserialize("Infinity"), Infinity);
  assertEquals(deserialize("-Infinity"), -Infinity);
});

Deno.test("deserialize symbol", () => {
  const symbol1 = deserialize<symbol>("Symbol()");
  assertEquals(typeof symbol1, "symbol");
  assertEquals(symbol1.description, undefined);

  const symbol2 = deserialize<symbol>('Symbol("desc1")');
  assertEquals(typeof symbol2, "symbol");
  assertEquals(symbol2.description, "desc1");

  const deserialized = deserialize<[symbol, symbol, symbol, [symbol]]>(
    '[$1,$2,$3,$4];Symbol("sym1");Symbol("sym2");Symbol("sym1");[$2]',
  );
  assertEquals(deserialized[0].description, "sym1");
  assertEquals(deserialized[1].description, "sym2");
  assertEquals(deserialized[2].description, "sym1");

  assertNotStrictEquals(deserialized[0], deserialized[2]);
  assertStrictEquals(
    deserialized[1],
    deserialized[3][0],
  );
});

Deno.test("deserialize built-in Set", () => {
  assertEquals(
    deserialize("Set(1,2,3,4,5)"),
    new Set([1, 2, 3, 4, 5]),
  );
});

Deno.test("deserialize built-in Set circular", () => {
  const deserialized = deserialize<Set<unknown>>("Set($0)");
  assertStrictEquals(
    deserialized,
    [...deserialized][0],
  );
});

Deno.test("deserialize built-in Map", () => {
  assertEquals(
    deserialize(
      'Map("string"=>"this is string",true=>"boolean",null=>"null",$1=>"object");{}',
    ),
    new Map<unknown, unknown>([
      ["string", "this is string"],
      [true, "boolean"],
      [null, "null"],
      [{}, "object"],
    ]),
  );
});

Deno.test("deserialize build-in Map deep", () => {
  const map1 = new Map([["key1_1", "value1_1"], ["key1_2", "value1_2"]]);
  const map2 = new Map([["key2_1", "value2_1"], ["key2_2", "value2_2"]]);

  assertEquals(
    deserialize(
      'Map("key1"=>$1,$2=>"val2");Map("key1_1"=>"value1_1","key1_2"=>"value1_2");Map("key2_1"=>"value2_1","key2_2"=>"value2_2")',
    ),
    new Map<unknown, unknown>([
      ["key1", map1] as const,
      [map2, "val2"] as const,
    ]),
  );
});

Deno.test("deserialize build-in Map circular", () => {
  const map1 = deserialize("Map($0=>$0)") as Map<unknown, unknown>;
  const keys1 = [...map1.keys()];
  assertEquals(keys1.length, 1);

  assertStrictEquals(keys1[0], map1);
  assertStrictEquals(map1.get(map1), map1);

  const map2 = deserialize('Map($0=>"val","key"=>$0)') as Map<unknown, unknown>;
  const keys2 = [...map2.keys()];
  assertEquals(keys2.length, 2);
  assertStrictEquals(map2.get(map2), "val");
  assertStrictEquals(map2.get("key"), map2);
});

Deno.test("deserialize array", () => {
  assertEquals(deserialize("[]"), []);

  assertEquals(
    deserialize(
      '[$1,$2,$3];[$4,$5];[1,2];[1];[$6,2,"",false,$7];[$8];{};[];[]',
    ),
    [[[{}, 2, "", false, []], [[]]], [1, 2], [1]],
  );

  assertEquals(
    deserialize('[$1,$2];{"name":"wan2land"};{"name":"wan3land"}'),
    [{ name: "wan2land" }, { name: "wan3land" }],
  );

  assertEquals(
    deserialize('{"users":$1};[$2,$3];{"name":"wan2land"};{"name":"wan3land"}'),
    { users: [{ name: "wan2land" }, { name: "wan3land" }] },
  );

  // also support json
  assertEquals(
    deserialize('[{"name":"wan2land"},{"name":"wan3land"}]'),
    [{ name: "wan2land" }, { name: "wan3land" }],
  );
});

Deno.test("deserialize object", () => {
  assertEquals(deserialize("{}"), {});

  assertEquals(deserialize('{"foo":"foo string","und":undefined}'), {
    foo: "foo string",
    und: undefined,
  });

  assertEquals(
    deserialize('{"string":$1,"true":$2,"false":$3};"string";true;false'),
    { string: "string", true: true, false: false },
  );
});

Deno.test("deserialize object self circular", () => {
  const result = deserialize<{ boolean: false; self: unknown }>(
    '{"boolean":false,"self":$0}',
  );

  assertEquals(result.boolean, false);
  assertStrictEquals(result.self, result);
});

Deno.test("deserialize object circular", () => {
  const result = deserialize<
    { children: { parent: unknown; sibling: unknown }[] }
  >(
    '{"children":[$1,$2]};{"parent":$0,"sibling":$2};{"parent":$0,"sibling":$1}',
  );

  assertStrictEquals(result.children[0].parent, result);
  assertStrictEquals(result.children[1].parent, result);

  assertStrictEquals(result.children[0].sibling, result.children[1]);
  assertStrictEquals(result.children[1].sibling, result.children[0]);
});

Deno.test("deserialize class object", () => {
  class TestUser {
    age = 0;
    constructor(public name: string) {
    }
  }

  const spyConsole = spy(console, "warn");

  const deserialized = deserialize(
    'TestUser{"name":"wan2land","age":20}',
    { classes: { TestUser } },
  ) as TestUser;

  assertInstanceOf(deserialized, TestUser);

  assertEquals(deserialized.name, "wan2land");
  assertEquals(deserialized.age, 20);

  assertEquals(spyConsole.calls.length, 0);
  spyConsole.restore();
});

Deno.test("deserialize class object with loadClass", () => {
  class TestUser {
    age = 0;
    constructor(public name: string) {
    }
  }

  const loadClass = spy((name: string) => {
    if (name === "TestUser") {
      return TestUser;
    }
    return null;
  });

  const deserialized = deserialize(
    'TestUser{"name":"wan2land","age":20}',
    {
      loadClass,
    },
  ) as TestUser;

  assertInstanceOf(deserialized, TestUser);

  assertEquals(deserialized.name, "wan2land");
  assertEquals(deserialized.age, 20);

  assertEquals(loadClass.calls.length, 1);
});

Deno.test("deserialize class object undefined", () => {
  const spyConsole = spy(console, "warn");

  assertEquals(
    deserialize(
      'TestUser{"name":"wan2land","age":20}',
    ),
    {
      name: "wan2land",
      age: 20,
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

Deno.test("deserialize class with private", () => {
  class TestUser {
    #_age = 0;
    constructor(public name: string) {
      this.#_age = 0;
    }

    setAge(age: number) {
      this.#_age = age;
    }

    getAge() {
      return this.#_age;
    }

    [toDeserialize](
      value: {
        name: string;
        age: number;
      },
    ) {
      this.name = value.name;
      this.#_age = value.age;
    }
  }

  const spyConsole = spy(console, "warn");

  const deserialized = deserialize(
    'TestUser{"name":"wan2land","age":20}',
    { classes: { TestUser } },
  ) as TestUser;

  assertInstanceOf(deserialized, TestUser);

  assertEquals(deserialized.name, "wan2land");
  assertEquals(deserialized.getAge(), 20);

  assertEquals(spyConsole.calls.length, 0);

  spyConsole.restore();
});

Deno.test("deserialize class with private", () => {
  class User {
    #comments: Comment[] = [];

    constructor(public name: string) {
    }

    [toDeserialize](
      value: {
        name: string;
        comments: Comment[];
      },
    ) {
      this.name = value.name;
      this.#comments = value.comments;
    }

    writeComment(text: string) {
      this.#comments.push(new Comment(text));
    }

    getComments() {
      return this.#comments;
    }
  }

  class Comment {
    constructor(public text: string) {}
  }

  const deserialized = deserialize(
    'User{"name":"wan2land","comments":$1};[$2,$3];Comment{"text":"hello world 1"};Comment{"text":"hello world 2"}',
    {
      classes: {
        User,
        Comment,
      },
    },
  ) as User;

  assertInstanceOf(deserialized, User);

  assertEquals(deserialized.name, "wan2land");

  const comments = deserialized.getComments();
  assertEquals(comments.length, 2);

  assertInstanceOf(comments[0], Comment);
  assertInstanceOf(comments[1], Comment);
  assertEquals(comments[0].text, "hello world 1");
  assertEquals(comments[1].text, "hello world 2");
});
