# superserial <a href="https://github.com/denostack"><img src="https://raw.githubusercontent.com/denostack/images/main/logo.svg" width="160" align="right" /></a>

<p>
  <a href="https://github.com/denostack/superserial/actions"><img alt="Build" src="https://img.shields.io/github/actions/workflow/status/denostack/superserial/ci.yml?branch=main&logo=github&style=flat-square" /></a>
  <a href="https://codecov.io/gh/denostack/superserial"><img alt="Coverage" src="https://img.shields.io/codecov/c/gh/denostack/superserial?style=flat-square" /></a>
  <img alt="License" src="https://img.shields.io/npm/l/superserial.svg?style=flat-square" />
  <img alt="Language Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
  <br />
  <a href="https://jsr.io/@denostack/superserial"><img alt="JSR version" src="https://jsr.io/badges/@denostack/superserial?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/superserial"><img alt="NPM Version" src="https://img.shields.io/npm/v/superserial.svg?style=flat-square&logo=npm" /></a>
  <a href="https://npmcharts.com/compare/superserial?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/superserial.svg?style=flat-square" /></a>
</p>

A comprehensive Serializer/Deserializer that can handle any data type.

## Installation

### Via JSR (Deno)

```bash
deno add jsr:@denostack/superserial
```

```ts
import { Superserial } from "@denostack/superserial";
```

### Via NPM (Node.js, Bun, Deno)

```bash
# npm
npm install superserial

# bun
bun add superserial

# deno
deno add npm:superserial
```

```ts
import { Superserial } from "superserial";
```

## Breaking Changes

### Serialized Format Change

> The serialized output format has been updated for **performance optimization** and introduces a **breaking change**
> when upgrading from `0.3.x` to `0.4.x`. Data serialized with `superserial` versions `0.3.x` (or earlier) cannot be
> deserialized with version `0.4.x` (or later).

## Index

- [Built-in Objects](#built-in-objects)
- [Circular Reference](#circular-reference)
- [Custom Class Support](#custom-class-support)

### Built-in Objects

**Value Properties**

- `NaN`
- `-0`, `+0`
- `Infinity`, `-Infinity`
- `undefined`

**Fundamental Objects**

- `Symbol`

**ETC**

- `BigInt`
- `Date`
- `RegExp`
- `Map`
- `Set`

```ts
const superserial = new Superserial();

const symbol = Symbol();
const serialized = superserial.serialize({
  nzero: -0,
  und: undefined,
  nan: NaN,
  inf: Infinity,
  ninf: -Infinity,
  sym: symbol,
  bigint: 100n,
  date: new Date(),
  regex: /abc/gmi,
  map: new Map([["key1", "value1"], ["key2", "value2"]]),
  set: new Set([1, 2, 3, 4]),
});

const deserialized = superserial.deserialize(serialized);
/*
{
  nzero: -0,
  und: undefined,
  nan: NaN,
  inf: Infinity,
  ninf: -Infinity,
  sym: Symbol(), // Symbol but not exact same with original
  bigint: 100n,
  date: 2025-12-15T09:05:09.108Z, // ... Date!
  regex: /abc/gim,
  map: Map(2) { "key1" => "value1", "key2" => "value2" },
  set: Set(4) { 1, 2, 3, 4 }
}
*/
```

### Circular Reference

Existing JSON functions do not support circular references, but **superserial** has solved this problem.

```ts
const nodes = [{ self: null as any, siblings: [] as any[] }, {
  self: null as any,
  siblings: [] as any[],
}];
nodes[0].self = nodes[0];
nodes[0].siblings = nodes;
nodes[1].self = nodes[1];
nodes[1].siblings = nodes;

const serialized = superserial.serialize(nodes);

console.log(serialized);
// [[[[0,1],[0,2]]],{"self":[0,1],"siblings":[0,0]},{"self":[0,2],"siblings":[0,0]}]

const deserialized = superserial.deserialize(serialized) as typeof nodes;

console.log(deserialized === deserialized[0].siblings); // true
console.log(deserialized[0] === deserialized[0].self); // true
console.log(deserialized === deserialized[1].siblings); // true
console.log(deserialized[1] === deserialized[1].self); // true
```

**Circular Set & Map**

```ts
const set = new Set();
set.add(set);

superserial.serialize(set); // [["Set",[0,0]]]

const map = new Map();
map.set(map, map);

superserial.serialize(map); // [["Map",[[[0,0],[0,0]]]]]
```

Deserialization also works perfectly!

```ts
const set = superserial.deserialize('[["Set",[0,0]]]') as Set<unknown>;

console.log(set === [...set][0]); // true

const map = superserial.deserialize('[["Map",[[[0,0],[0,0]]]]]') as Map<unknown, unknown>;

console.log(map === [...map.keys()][0]); // true
console.log(map === map.get([...map.keys()][0])); // true
```

### Custom Class Support

Classes contain methods, getters, etc., but JSON doesn't fully support them. **superserial** allows you to preserve the
class instance, including all its methods and internal state.

#### 1. Using Decorators (Recommended)

The easiest way to register a class is using the `@serializable` decorator. You need to enable the `decorator` option
when creating the `Superserial` instance.

```ts
import { serializable, Superserial } from "superserial";

@serializable()
class TestUser {
  constructor(public name: string, public age: number) {}

  greet() {
    return `Hello, ${this.name}`;
  }
}

// Enable decorator support
const superserial = new Superserial({ decorator: true });

const serialized = superserial.serialize(new TestUser("wan2land", 20));
console.log(serialized);
// [["TestUser",{"name":"wan2land","age":20}]]

const user = superserial.deserialize<TestUser>(serialized);
console.log(user instanceof TestUser); // true
console.log(user.greet()); // "Hello, wan2land"
```

You can also specify a custom name (alias) or custom serialization logic directly in the decorator.

```ts
@serializable("MyUser") // Alias
class TestUser {/* ... */}

@serializable({
  toSerialize: (user) => ({ n: user.name }), // Custom logic
  toDeserialize: (value) => new TestUser(value.n, 0),
})
class CompactUser {/* ... */}
```

#### 2. Internal Control (Using Symbols)

If you need fine-grained control, such as handling private fields (`#private`) or transforming data, you can implement
the `toSerialize` and `toDeserialize` symbols within your class. This keeps the serialization logic encapsulated within
the class.

```ts
import { Superserial, toDeserialize, toSerialize } from "superserial";

class SecureUser {
  #age = 0;
  constructor(public name: string) {
    this.#age = 0;
  }

  setAge(age: number) {
    this.#age = age;
  }

  getAge() {
    return this.#age;
  }

  // Define what to save
  [toSerialize]() {
    return {
      name: this.name,
      age: this.#age, // Access private field
    };
  }

  // Define how to restore
  static [toDeserialize](value: { name: string; age: number }) {
    const user = new SecureUser(value.name);
    user.setAge(value.age);
    return user;
  }
}

const superserial = new Superserial({ classes: { SecureUser } });

const serialized = superserial.serialize(new SecureUser("Alice"));
// [["SecureUser",{"name":"Alice","age":0}]]
```

#### 3. External Definition (Using `defineClass`)

If you are using a class from an external library and cannot modify its source code (e.g., adding decorators or
symbols), you can inject the serialization logic using `defineClass`.

```ts
import { Superserial } from "superserial";

// Assume this is from a 3rd-party library
class ThirdPartyUser {
  constructor(public name: string, public age: number) {}
}

const superserial = new Superserial();

superserial.defineClass("ThirdPartyUser", {
  type: ThirdPartyUser,
  toSerialize(user: ThirdPartyUser) {
    return { n: user.name, a: user.age };
  },
  toDeserialize(value: { n: string; a: number }) {
    return new ThirdPartyUser(value.n, value.a);
  },
});

const serialized = superserial.serialize(new ThirdPartyUser("Bob", 30));
console.log(serialized);
// [["ThirdPartyUser",{"n":"Bob","a":30}]]
```

#### Manual Registration

If you don't use decorators, you can simply register classes via the `classes` option.

```ts
const serializer = new Superserial({
  classes: {
    TestUser,
    MyUser: User, // Register with an alias
  },
});
```

## Benchmark

Please see [benchmark results](.benchmark).

## See also

- [Creating Superserial](https://wan2.land/posts/2022/09/14/superserial/) - My blog post about superserial. (Korean)
- [SuperClosure](https://github.com/jeremeamia/super_closure) PHP Serialize Library, superserial was inspired by this.
- [flatted](https://github.com/WebReflection/flatted)
- [lave](https://github.com/jed/lave)
- [arson](https://github.com/benjamn/arson)
- [devalue](https://github.com/Rich-Harris/devalue)
- [superjson](https://github.com/blitz-js/superjson)
