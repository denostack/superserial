# superserial <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

<p>
  <a href="https://github.com/denostack/superserial/actions"><img alt="Build" src="https://img.shields.io/github/actions/workflow/status/denostack/superserial/ci.yml?branch=main&logo=github&style=flat-square" /></a>
  <a href="https://codecov.io/gh/denostack/superserial"><img alt="Coverage" src="https://img.shields.io/codecov/c/gh/denostack/superserial?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/superserial.svg?style=flat-square" />
  <img alt="Language Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <br />
  <a href="https://deno.land/x/superserial"><img alt="deno.land/x/superserial" src="https://img.shields.io/badge/dynamic/json?url=https://api.github.com/repos/denostack/superserial/tags&query=$[0].name&display_name=tag&label=deno.land/x/superserial@&style=flat-square&logo=deno&labelColor=000&color=777" /></a>
  <a href="https://www.npmjs.com/package/superserial"><img alt="Version" src="https://img.shields.io/npm/v/superserial.svg?style=flat-square&logo=npm" /></a>
  <a href="https://npmcharts.com/compare/superserial?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/superserial.svg?style=flat-square" /></a>
</p>

A comprehensive Serializer/Deserializer that can handle any data type.

## Usage

### with Deno

```ts
import { Serializer } from "https://deno.land/x/superserial/mod.ts";

const serializer = new Serializer();

const nodes = [{ self: null as any, siblings: [] as any[] }, {
  self: null as any,
  siblings: [] as any[],
}];
nodes[0].self = nodes[0];
nodes[0].siblings = nodes;
nodes[1].self = nodes[1];
nodes[1].siblings = nodes;

const serialized = serializer.serialize(nodes);

console.log(serialized);
// [$1,$2];{"self":$1,"siblings":$0};{"self":$2,"siblings":$0}
```

### with Node.js & Browser

**Install**

```bash
npm install superserial
```

```ts
import { Serializer } from "superserial";

// Usage is as above :-)
```

## Index

- [Built-in Objects](#built-in-objects)
- [Circular Reference](#circular-reference)
- [Class Support](#class-support)

### Built-in Objects

**Value Properties**

- `NaN`
- `Infinity`, `-Infinity`
- `undefined`

```ts
serializer.serialize({
  und: undefined,
  nan: NaN,
  inf: Infinity,
  ninf: -Infinity,
}); // {"und":undefined,"nan":NaN,"inf":Infinity,"ninf":-Infinity}
```

**Fundamental Objects**

- `Symbol`

**ETC**

- `BigInt`
- `Date`
- `RegExp`
- `Map`
- `Set`

```ts
const symbol = Symbol();
serializer.serialize({
  sym: symbol,
  bigint: 100n,
  date: new Date(),
  regex: /abc/gmi,
  map: new Map([["key1", "value1"], ["key2", "value2"]]),
  set: new Set([1, 2, 3, 4]),
});
// {"sym":$1,"bigint":100n,"date":$2,"regex":$3,"map":$4,"set":$5};Symbol();Date(1648740167514);/abc/gim;Map("key1"=>"value1","key2"=>"value2");Set(1,2,3,4)
```

### Circular Reference

Existing JSON functions do not support circular references, but **superserial**
has solved this problem.

```ts
const nodes = [{ self: null as any, siblings: [] as any[] }, {
  self: null as any,
  siblings: [] as any[],
}];
nodes[0].self = nodes[0];
nodes[0].siblings = nodes;
nodes[1].self = nodes[1];
nodes[1].siblings = nodes;

const serialized = serializer.serialize(nodes);

console.log(serialized);
// [$1,$2];{"self":$1,"siblings":$0};{"self":$2,"siblings":$0}

const deserialized = serializer.deserialize(serialized) as typeof nodes;

console.log(deserialized === deserialized[0].siblings); // true
console.log(deserialized[0] === deserialized[0].self); // true
console.log(deserialized === deserialized[1].siblings); // true
console.log(deserialized[1] === deserialized[1].self); // true
```

**Circular Set & Map**

```ts
const set = new Set();
set.add(set);

serializer.serialize(set); // Set($0)

const map = new Map();
map.set(map, map);

serializer.serialize(map); // Map($0=>$0)
```

Deserialization also works perfectly!

```ts
const set = serializer.deserialize("Set($0)");

console.log(set === [...set][0]); // true

const map = serializer.deserialize("Map($0=>$0)");

console.log(map === [...map.keys()][0]); // true
console.log(map === map.get([...map.keys()][0])); // true
```

### Class Support

Classes contain methods, getters, etc., but JSON doesn't fully support them.
**superserial** includes features that make it easy to use.

The class to be used for `deserialize` is defined when the Serializer is
created.

```ts
class TestUser {
  constructor(
    public name?: string,
    public age?: number,
  ) {
  }
}

const serializer = new Serializer({ classes: { TestUser } });
```

Serializes the object and then deserializes it again. Since the original class
object is converted as it is, all getters and methods can be used as they are.

```ts
const serialized = serializer.serialize(new TestUser("wan2land", 20));
console.log(serialized);
// TestUser{"name":"wan2land","age":20}

const user = serializer.deserialize(serialized);
console.log(user); // TestUser { name: "wan2land", age: 20 }
```

#### toSerialize / toDeserialize

Private variables can be converted using two special symbols (`toSerialize`,
`toDeserialize`).

When serializing(`serialize`), the object's data is created based on the
`toSerialize` method. You can check the result of `toSerialize` by looking at
the serialized string.

When deserializing(`deserialize`), it is impossible to create an object without
a constructor call. (ref.
[No backdoor to access private](https://github.com/tc39/proposal-class-fields#no-backdoor-to-access-private))
If the `toDeserialize` method is included, a value can be injected through
`toDeserialize` after calling the constructor.

```ts
import {
  Serializer,
  toDeserialize,
  toSerialize,
} from "https://deno.land/x/superserial/mod.ts";

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

  [toSerialize]() {
    return {
      name: this.name,
      age: this.#_age,
    };
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

const serializer = new Serializer({ classes: { TestUser } });

{
  const user = new TestUser("wan2land");
  user.setAge(20);

  console.log(serializer.serialize(user)); // TestUser{"name":"wan2land","age":20}
}
{
  const user = serializer.deserialize<TestUser>(
    'TestUser{"name":"wan2land","age":20}',
  );
  console.log(user); // TestUser { name: "wan2land" }
  console.log(user.getAge()); // 20
}
```

## Benchmark

Please see [benchmark results](.benchmark).

## See also

- [Creating Superserial](https://wan2.land/posts/2022/09/14/superserial/) - My
  blog post about superserial. (Korean)
- [SuperClosure](https://github.com/jeremeamia/super_closure) PHP Serialize
  Library, superserial was inspired by this.
- [flatted](https://github.com/WebReflection/flatted)
- [lave](https://github.com/jed/lave)
- [arson](https://github.com/benjamn/arson)
- [devalue](https://github.com/Rich-Harris/devalue)
- [superjson](https://github.com/blitz-js/superjson)
