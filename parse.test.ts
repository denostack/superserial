import { assertEquals, assertThrows } from "testing/asserts.ts";

import { parse } from "./parse.ts";

Deno.test("parse, ignore whitespace", () => {
  assertEquals(parse("  null  "), [[1]]);
  assertEquals(parse("\n\r\t\v\f \u00A0\uFEFF\u2028\u2029null  "), [[1]]);
});

Deno.test("parse, undefined", () => {
  assertEquals(parse("undefined"), [[0]]);
  assertEquals(parse("  undefined  "), [[0]]);
});

Deno.test("parse, null", () => {
  assertEquals(parse("null"), [[1]]);
  assertEquals(parse("  null  "), [[1]]);
});

Deno.test("parse, boolean", () => {
  assertEquals(parse("true"), [[2, true]]);
  assertEquals(parse("false"), [[2, false]]);

  assertEquals(parse("  true  "), [[2, true]]);
  assertEquals(parse("  false  "), [[2, false]]);
});

Deno.test("parse, number", () => {
  assertEquals(parse("30"), [[3, 30]]);
  assertEquals(parse("30."), [[3, 30]]);
  assertEquals(parse("30.1"), [[3, 30.1]]);
  assertEquals(parse("30.1e+5"), [[3, 3010000]]);
  assertEquals(parse("30.1E-5"), [[3, 0.000301]]);
  assertEquals(parse("-30"), [[3, -30]]);
  assertEquals(parse("-30."), [[3, -30]]);
  assertEquals(parse("-30.1"), [[3, -30.1]]);
  assertEquals(parse("-30.1E+5"), [[3, -3010000]]);
  assertEquals(parse("-30.1e-5"), [[3, -0.000301]]);

  assertEquals(parse("  30  "), [[3, 30]]);
  assertEquals(parse("  30.  "), [[3, 30]]);
  assertEquals(parse("  30.1  "), [[3, 30.1]]);
  assertEquals(parse("  30.1E+5  "), [[3, 3010000]]);
  assertEquals(parse("  30.1e-5  "), [[3, 0.000301]]);
  assertEquals(parse("  -30  "), [[3, -30]]);
  assertEquals(parse("  -30.  "), [[3, -30]]);
  assertEquals(parse("  -30.1  "), [[3, -30.1]]);
  assertEquals(parse("  -30.1e+5  "), [[3, -3010000]]);
  assertEquals(parse("  -30.1E-5  "), [[3, -0.000301]]);
});

Deno.test("parse, number error", () => {
  assertThrows(
    () => parse("3a"),
    SyntaxError,
    "Unexpected token 'a' in SuperSerial at position 2",
  );

  assertThrows(
    () => parse("30.1e"),
    SyntaxError,
    "Unexpected end of SuperSerial input",
  );

  assertThrows(
    () => parse("30.1e+a"),
    SyntaxError,
    "Unexpected token 'a' in SuperSerial at position 7",
  );
});

Deno.test("parse, bigint", () => {
  assertEquals(parse("30n"), [[4, 30n]]);
  assertEquals(parse("-30n"), [[4, -30n]]);
  assertEquals(parse("9007199254740991000000n"), [[
    4,
    9007199254740991000000n,
  ]]);
  assertEquals(parse("-9007199254740991000000n"), [[
    4,
    -9007199254740991000000n,
  ]]);

  assertEquals(parse("  30n  "), [[4, 30n]]);
  assertEquals(parse("  -30n  "), [[4, -30n]]);
  assertEquals(parse("  9007199254740991000000n  "), [[
    4,
    9007199254740991000000n,
  ]]);
  assertEquals(parse("  -9007199254740991000000n  "), [[
    4,
    -9007199254740991000000n,
  ]]);
});

Deno.test("parse, NaN & Infinity", () => {
  assertEquals(parse("NaN"), [[3, NaN]]);
  assertEquals(parse("Infinity"), [[3, Infinity]]);
  assertEquals(parse("-Infinity"), [[3, -Infinity]]);
});

Deno.test("parse, string", () => {
  assertEquals(parse('"string"'), [[5, "string"]]);
  assertEquals(parse('"str\\nin\\\\g"'), [[5, "str\nin\\g"]]);

  assertEquals(parse('   "string"   '), [[5, "string"]]);
  assertEquals(parse('  "str\\nin\\\\g"  '), [[5, "str\nin\\g"]]);

  // special characters
  assertEquals(parse('   "\\u1234"   '), [[5, "\u1234"]]);
  assertEquals(parse('   "\\""   '), [[5, '"']]);
  assertEquals(parse('   "\\b"   '), [[5, "\b"]]);
  assertEquals(parse('   "\\f"   '), [[5, "\f"]]);
  assertEquals(parse('   "\\r"   '), [[5, "\r"]]);
  assertEquals(parse('   "\\t"   '), [[5, "\t"]]);
});

Deno.test("parse, string error", () => {
  assertThrows(
    () => parse('"s'),
    SyntaxError,
    "Unexpected end of SuperSerial input",
  );
});

Deno.test("parse, array", () => {
  assertEquals(parse("[]"), [[16, []]]);
  assertEquals(parse('[null,true,false,1,10n,"..."]'), [[16, [
    [1],
    [2, true],
    [2, false],
    [3, 1],
    [4, 10n],
    [5, "..."],
  ]]]);

  assertEquals(parse("  [  ]  "), [[16, []]]);
  assertEquals(
    parse('  [  null  ,  true  ,  false  ,  1  ,  10n  ,  "..."  ]  '),
    [[
      16,
      [
        [1],
        [2, true],
        [2, false],
        [3, 1],
        [4, 10n],
        [5, "..."],
      ],
    ]],
  );
});

Deno.test("parse, array error", () => {
  assertThrows(
    () => parse("[1,2,3,]"),
    SyntaxError,
    "Unexpected token ']' in SuperSerial at position 8",
  );
});

Deno.test("parse, object", () => {
  assertEquals(parse("{}"), [[17, null, []]]);
  assertEquals(parse('{"name":"wan2land","age":20}'), [[17, null, [
    [[5, "name"], [5, "wan2land"]],
    [[5, "age"], [3, 20]],
  ]]]);
  assertEquals(parse("Something{}"), [[17, "Something", []]]);
  assertEquals(parse("something{}"), [[17, "something", []]]);

  assertEquals(parse("  {  }  "), [[17, null, []]]);
  assertEquals(parse('  {  "name"  :  "wan2land"  ,  "age"  :  20  }  '), [[
    17,
    null,
    [
      [[5, "name"], [5, "wan2land"]],
      [[5, "age"], [3, 20]],
    ],
  ]]);
  assertEquals(parse("  Something  {  }  "), [[17, "Something", []]]);
  assertEquals(parse("  something  {  }  "), [[17, "something", []]]);
});

Deno.test("parse, object error", () => {
  assertThrows(
    () => parse('{"name"}'),
    SyntaxError,
    "Unexpected token '}' in SuperSerial at position 8",
  );
  assertThrows(
    () => parse('{"name":1%'),
    SyntaxError,
    "Unexpected token '%' in SuperSerial at position 10",
  );
});

Deno.test("parse, regexp", () => {
  assertEquals(parse("/a/"), [[32, "a", null]]);
  assertEquals(parse("/a\\\\/gmi"), [[32, "a\\\\", "gmi"]]);
  assertEquals(parse("/a/img"), [[32, "a", "img"]]);

  assertEquals(parse("  /a/  "), [[32, "a", null]]);
  assertEquals(parse("  /a\\\\/gmi  "), [[32, "a\\\\", "gmi"]]);
  assertEquals(parse("  /a/img  "), [[32, "a", "img"]]);
});

Deno.test("parse, symbol", () => {
  assertEquals(parse("Symbol()"), [[6, null]]);
  assertEquals(parse('Symbol("description")'), [[6, "description"]]);

  assertEquals(parse("  Symbol  (  )  "), [[6, null]]);
  assertEquals(parse('  Symbol  (  "description"  )  '), [[6, "description"]]);
});

Deno.test("parse, built-in Date", () => {
  assertEquals(parse("Date(123456)"), [[33, 123456]]);
  assertEquals(parse("Date(-123456)"), [[33, -123456]]);

  assertEquals(parse("  Date  (  123456  )  "), [[33, 123456]]);
  assertEquals(parse("  Date  (  -123456  )  "), [[33, -123456]]);
});

Deno.test("parse, built-in Set", () => {
  assertEquals(
    parse("Set()"),
    [[34, []]],
  );

  assertEquals(
    parse("Set(1,2,3,4,5)"),
    [[34, [[3, 1], [3, 2], [3, 3], [3, 4], [3, 5]]]],
  );

  assertEquals(
    parse("  Set ( 1 , 2 , 3 , 4 , 5 )  "),
    [[34, [[3, 1], [3, 2], [3, 3], [3, 4], [3, 5]]]],
  );
});

Deno.test("parse, built-in Map", () => {
  assertEquals(
    parse(
      "Map()",
    ),
    [[35, []]],
  );

  assertEquals(
    parse(
      'Map("string"=>"this is string",true=>"boolean",null=>"null",$1=>"object")',
    ),
    [[35, [
      [
        [5, "string"],
        [5, "this is string"],
      ],
      [
        [2, true],
        [5, "boolean"],
      ],
      [
        [1],
        [5, "null"],
      ],
      [
        [64, 1],
        [5, "object"],
      ],
    ]]],
  );

  assertEquals(
    parse(
      '  Map  (  "string"  =>  "this is string"  ,  true  =>  "boolean"  ,  null  =>  "null"  ,  $1  =>  "object"  )  ',
    ),
    [[35, [
      [
        [5, "string"],
        [5, "this is string"],
      ],
      [
        [2, true],
        [5, "boolean"],
      ],
      [
        [1],
        [5, "null"],
      ],
      [
        [64, 1],
        [5, "object"],
      ],
    ]]],
  );
});

Deno.test("parse, ref", () => {
  assertEquals(parse("[$0]"), [[16, [[64, 0]]]]);
  assertEquals(parse('{"a":$2}'), [[17, null, [[[5, "a"], [64, 2]]]]]);

  assertEquals(parse("  [  $0  ]  "), [[16, [[64, 0]]]]);
  assertEquals(parse('  {  "a"  :  $2  }  '), [[17, null, [[[5, "a"], [
    64,
    2,
  ]]]]]);
});

Deno.test("parse, multiple roots", () => {
  assertEquals(parse("1;2;3"), [[3, 1], [3, 2], [3, 3]]);
  assertEquals(parse(" 1  ;  2  ;  3  "), [[3, 1], [3, 2], [3, 3]]);
});
