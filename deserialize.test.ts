import {
  assertEquals,
  assertInstanceOf,
  assertStrictEquals,
} from "https://deno.land/std@0.131.0/testing/asserts.ts";
import { assertSpyCall, spy } from "https://deno.land/x/mock@0.15.0/mod.ts";

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

Deno.test("deserialize extend scalar", () => {
  assertEquals(deserialize("NaN"), NaN);
  assertEquals(deserialize("Infinity"), Infinity);
  assertEquals(deserialize("-Infinity"), -Infinity);
});

Deno.test("deserialize builtin Map", () => {
  assertEquals(
    deserialize(
      'Map{"_":$1};[$2,$3,$4,$5];["string","this is string"];[true,"boolean"];[null,"null"];[$6,"object"];{}',
    ),
    new Map<any, any>([
      ["string", "this is string"],
      [true, "boolean"],
      [null, "null"],
      [{}, "object"],
    ]),
  );
});

Deno.test("deserialize builtin Set", () => {
  assertEquals(
    deserialize('Set{"_":$1};[1,2,3,4,5]'),
    new Set([1, 2, 3, 4, 5]),
  );
});

Deno.test("deserialize regex", () => {
  assertEquals(deserialize("/abc/"), /abc/);

  assertEquals(deserialize("/abc/gmi"), /abc/gmi);
  assertEquals(deserialize("/abc/gim"), /abc/gmi);
  assertEquals(deserialize("/abc/mgi"), /abc/gmi);
  assertEquals(deserialize("/abc/mig"), /abc/gmi);
  assertEquals(deserialize("/abc/img"), /abc/gmi);
  assertEquals(deserialize("/abc/igm"), /abc/gmi);
});

Deno.test("deserialize array", () => {
  assertEquals(deserialize("[]"), []);

  assertEquals(
    deserialize(
      '[$1,$7,$8];[$2,$5];[$3,2,"",false,$4];{};[];[$6];[];[1,2];[1]',
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
  const result = deserialize('{"boolean":false,"self":$0}');

  assertEquals(result.boolean, false);
  assertStrictEquals(result.self, result);
});

Deno.test("deserialize object circular", () => {
  const result = deserialize(
    '{"children":[$1,$2]};{"parent":$0,"sibling":$2};{"parent":$0,"sibling":$1}',
  );

  assertStrictEquals(result.children[0].parent, result);
  assertStrictEquals(result.children[1].parent, result);

  assertStrictEquals(result.children[0].sibling, result.children[1]);
  assertStrictEquals(result.children[1].sibling, result.children[0]);
});

Deno.test("deserialize class without define", () => {
  const spyConsole = spy(console, "warn");

  assertEquals(
    deserialize(
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

Deno.test("deserialize class", () => {
  class TestUser {
    #_privateSomething = 1;
    publicSomething = 2;
    constructor(public name: string, public age: number) {
    }
  }

  const spyConsole = spy(console, "warn");

  const deserialized = deserialize(
    'TestUser{"name":"wan2land","age":20,"publicSomething":2}',
    { classes: { TestUser } },
  );

  assertEquals(deserialized, new TestUser("wan2land", 20));
  assertEquals(deserialized instanceof TestUser, true);

  assertEquals(spyConsole.calls.length, 0);

  spyConsole.restore();
});

Deno.test("deserialize class with private", () => {
  class TestUser {
    static [toDeserialize](
      values: {
        name: string;
        age: number;
        publicSomething: number;
        privateSomething: number;
      },
    ) {
      const user = new TestUser(values.name, values.age);
      user.publicSomething = values.publicSomething;
      user.#_privateSomething = values.privateSomething;
      return user;
    }

    #_privateSomething = 1;
    publicSomething = 2;
    constructor(public name: string, public age: number) {
    }

    get privateViaGetter() {
      return this.#_privateSomething;
    }
  }

  const spyConsole = spy(console, "warn");

  const deserialized = deserialize(
    'TestUser{"name":"wan2land","age":20,"publicSomething":2,"privateSomething":30}',
    { classes: { TestUser } },
  ) as TestUser;

  assertEquals(deserialized, new TestUser("wan2land", 20));
  assertEquals(deserialized.privateViaGetter, 30);
  assertInstanceOf(deserialized, TestUser);

  assertEquals(spyConsole.calls.length, 0);

  spyConsole.restore();
});
