# superserial

## Useage

```ts
import { Serializer } from "https://deno.land/x/superserial/mod.ts";

const serializer = new Serializer();

const obj = {
  string: "string",
  number: 3000,
  nan: NaN,
  infinity: Infinity,
  bigint: 12341234123412341234123412341234n,
  children: [
    { parent: null as any },
    { parent: null as any },
  ],
};
obj.children.forEach((child) => child.parent = obj); // circular reference

const serialized = serializer.serialize(obj);

console.log(serialized);
// output:
// {"string":"string","number":3000,"nan":NaN,"infinity":Infinity,"bigint":12341234123412341234123412341234n,"children":[$1,$2]};{"parent":$0};{"parent":$0}

const deserialized = serializer.deserialize(serialized);

console.log(deserialized.children[0].parent === deserialized); // true
console.log(deserialized.children[1].parent === deserialized); // true
```

## Support

- [x] Extend Scalar, `NaN`, `Infinity`, `undefined`, `bigint`
- [x] Circular
- [x] Class
- [ ] Serialize / Deserialize method
- [ ] `function`
