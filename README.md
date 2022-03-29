# superserial

<p>
  <a href="https://npmcharts.com/compare/superserial?minimal=true"><img alt="Downloads" src="https://img.shields.io/npm/dt/superserial.svg?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/superserial"><img alt="Version" src="https://img.shields.io/npm/v/superserial.svg?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/superserial"><img alt="License" src="https://img.shields.io/npm/l/superserial.svg?style=flat-square" /></a>
  <img alt="Language Typescript" src="https://img.shields.io/badge/language-Typescript-007acc.svg?style=flat-square" />
</p>

After data transfer, when the object needs to be restored, `JSON` has many
limitations. It does not support values such as `Infinity` and `NaN`, and does
not provide circular references.

**superserial** provides serialization in any way you can imagine.

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

- [Extending types](#extending-types)
- [Circular Reference](#circular-reference)
- [Class Support](#class-support)

### Extending types

- `undefined`
- `BigInt`
- `RegExp`
- `Number`
  - `NaN`
  - `Infinity`, `-Infinity`

```ts
const output = serializer.serialize({
  string: "string",
  true: true,
  false: false,
  number: 3.141592,
  null: null,
  und: undefined,
  nan: NaN,
  inf: Infinity,
  ninf: -Infinity,
  regex: /abc/gmi,
});

console.log(output);
// {"string":"string","true":true,"false":false,"number":3.141592,"null":null,"und":undefined,"nan":NaN,"inf":Infinity,"ninf":-Infinity,"regex":/abc/gim}
```

### Built-in Classes

- `Map`
- `Set`
- `Date`

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
console.log(deserialized[1] === deserialized[1].self);
```

### Class Support

Classes contain methods, getters, etc., but JSON doesn't fully support them.
**superserial** includes features that make it easy to use.

The class to be used for `deserialize` is defined when the Serializer is
created.

```ts
class TestUser {
  constructor(
    public name: string,
    public birth: number,
  ) {
  }

  get age() {
    return new Date().getFullYear() - this.birth;
  }
}

const serializer = new Serializer({ classes: { TestUser } });
```

Serializes the object and then deserializes it again. Since the original class
object is converted as it is, all getters and methods can be used as they are.

```ts
const serialized = serializer.serialize(new TestUser("wan2land", 2000));
console.log(serialized);
// TestUser{"name":"wan2land","birth":2000}

const user = serializer.deserialize(serialized);
console.log(user); // TestUser { name: "wan2land", birth: 2000 }
console.log(user.age); // 22
```

#### toSerialize / toDeserialize

Private variables can be converted using two special symbols (`toSerialize`,
`toDeserialize`).

```ts
import {
  Serializer,
  toDeserialize,
  toSerialize,
} from "https://deno.land/x/superserial/mod.ts";

class TestUser {
  static [toDeserialize](data: { name: string; serializedBirth: number }) {
    const user = new TestUser(data.name, 0);
    user.#_birth = data.serializedBirth;
    return user;
  }

  #_birth: number;

  constructor(
    public name: string,
    birth: number,
  ) {
    this.#_birth = birth;
  }

  getBirth() {
    return this.#_birth;
  }

  [toSerialize]() {
    return {
      name: this.name,
      serializedBirth: this.#_birth,
    };
  }
}

const serializer = new Serializer({ classes: { TestUser } });

const serialized = serializer.serialize(new TestUser("wan2land", 2000));
console.log(serialized);
// TestUser{"name":"wan2land","serializedBirth":2000}

const user = serializer.deserialize<TestUser>(serialized);
console.log(user); // TestUser { name: "wan2land" }
console.log(user.getBirth()); // 2000
```

## TODO

- [ ] `function` type
