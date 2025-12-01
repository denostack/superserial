// deno-lint-ignore-file no-explicit-any
const users: any[] = [];

for (let i = 0; i < 1000; i++) {
  users.push({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    registeredAt: new Date(Date.now() - Math.floor(Math.random() * 1e10)),
    isActive: i % 2 === 0,
    balance: BigInt(Math.floor(Math.random() * 1000000)),
    meta: {
      loginCount: Math.floor(Math.random() * 100),
      roles: ["user", i % 10 === 0 ? "admin" : "guest"],
      preferences: {
        theme: i % 2 === 0 ? "dark" : "light",
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      },
    },
  });
}

const map = new Map<any, any>();
const set = new Set<any>();

export const complex: any = {
  description: "Root of the complex benchmark object",
  createdAt: new Date(),
  updatedAt: new Date(),
  pattern: /^[a-z0-9]+$/i,
  infinity: Infinity,
  negativeInfinity: -Infinity,
  nan: NaN,
  users: users,
  dataMap: map,
  dataSet: set,
  nestedDeep: {
    level: 0,
    child: null as any,
  },
};

// Deep nesting with back references
let current = complex.nestedDeep;
for (let i = 0; i < 50; i++) {
  current.child = {
    level: i + 1,
    parent: current,
    randomData: Math.random(),
    child: null,
  };
  current = current.child;
}
current.rootReference = complex; // Link deep bottom back to root

// Populate Map with complex keys and values
map.set("root", complex);
map.set(complex, "The root object as a key");
map.set(users[0], "User 0 as key");
map.set("nestedMap", new Map([["a", 1], ["b", 2]]));

// Populate Set with mixed types and self-references
set.add(1);
set.add("string");
set.add(complex);
set.add(map);
set.add(set); // Set containing itself
set.add(users[50]);

// Final self-references on root
complex.self = complex;
complex.circularMap = map;
complex.circularSet = set;

export const simple = {
  string: "String",
  number: 1000.0,
  true: true,
  false: false,
  null: null,
  array: [{ id: 1 }, { id: 2 }, { id: 3 }],
  object: {
    numbers: [1, 2, 3, 4, 5],
    strings: ["foo", "bar", "baz"],
  },
};
