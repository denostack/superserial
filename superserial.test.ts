import { assertEquals, assertInstanceOf, assertNotInstanceOf } from "@std/assert";
import { Superserial, toDeserialize, toSerialize } from "./mod.ts";
import { Serializable, serializable } from "./decorators/serializable.ts";

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

  static [toDeserialize](
    value: {
      name: string;
      age: number;
    },
  ) {
    const user = new TestUser(value.name);
    user.setAge(value.age);
    return user;
  }
}
Serializable()(TestUser); // typescript decorator

class TestArticle {
  constructor(public title: string, public content: string) {}
}

Deno.test("superserial, default serialize/deserialize without class definitions", () => {
  const superserial = new Superserial({ classes: {} });
  const serialized = '[{"title":"hello world","content":"yes!"}]';

  {
    const article = new TestArticle("hello world", "yes!");

    assertEquals(superserial.serialize(article), serialized);
  }
  {
    const article = superserial.deserialize<TestArticle>(serialized);

    assertNotInstanceOf(article, TestArticle);
    assertEquals(article, { title: "hello world", content: "yes!" });
  }
});

Deno.test("superserial, default serialize/deserialize with default class definitions", () => {
  const superserial1 = new Superserial({ classes: { TestArticle } });
  const superserial2 = new Superserial();
  superserial2.defineClasses({ TestArticle });

  const serialized = '[["TestArticle",{"title":"hello world","content":"yes!"}]]';

  for (const superserial of [superserial1, superserial2]) {
    {
      const article = new TestArticle("hello world", "yes!");

      assertEquals(superserial.serialize(article), serialized);
    }
    {
      const article = superserial.deserialize<TestArticle>(serialized);

      assertInstanceOf(article, TestArticle);
      assertEquals(article.title, "hello world");
      assertEquals(article.content, "yes!");
    }
  }
});

Deno.test("superserial, serialize/deserialize with toSerialize, toDeserialize", () => {
  const superserial1 = new Superserial({ classes: { TestUser } });
  const superserial2 = new Superserial();
  superserial2.defineClasses({ TestUser });

  const serialized = '[["TestUser",{"name":"Alice","age":20}]]';

  for (const superserial of [superserial1, superserial2]) {
    {
      const user = new TestUser("Alice");
      user.setAge(20);

      assertEquals(superserial.serialize(user), serialized);
    }
    {
      const user = superserial.deserialize<TestUser>(serialized);

      assertInstanceOf(user, TestUser);
      assertEquals(user.name, "Alice");
      assertEquals(user.getAge(), 20);
    }
  }
});

Deno.test("superserial, alias class name", () => {
  const superserial1 = new Superserial({ classes: { AliasedUser: TestUser } });
  const superserial2 = new Superserial();
  superserial2.defineClasses({ AliasedUser: TestUser });

  const serialized = '[["AliasedUser",{"name":"Bob","age":20}]]';

  for (const superserial of [superserial1, superserial2]) {
    {
      const user = new TestUser("Bob");
      user.setAge(20);

      assertEquals(superserial.serialize(user), serialized);
    }
    {
      const user = superserial.deserialize<TestUser>(serialized);

      assertInstanceOf(user, TestUser);
      assertEquals(user.name, "Bob");
    }
  }
});

Deno.test("superserial, define class definitions outside", () => {
  const superserial1 = new Superserial({
    classes: {
      AliasedArticle: {
        type: TestArticle,
        toSerialize(value: TestArticle) {
          return [value.title, value.content, 1];
        },
        toDeserialize(value: [string, string, number]) {
          return Object.assign(new TestArticle(value[0], value[1]), {
            index: value[2],
          });
        },
      },
    },
  });
  const superserial2 = new Superserial();
  superserial2.defineClasses({
    AliasedArticle: {
      type: TestArticle,
      toSerialize(value: TestArticle) {
        return [value.title, value.content, 2];
      },
      toDeserialize(value: [string, string, number]) {
        return Object.assign(new TestArticle(value[0], value[1]), {
          index: value[2],
        });
      },
    },
  });
  const superserial3 = new Superserial();
  superserial3.defineClass(
    "AliasedArticle",
    {
      type: TestArticle,
      toSerialize(value: TestArticle) {
        return [value.title, value.content, 3] as const;
      },
      toDeserialize(value) {
        return Object.assign(new TestArticle(value[0], value[1]), {
          index: value[2],
        });
      },
    },
  );

  for (
    const [index, superserial] of [superserial1, superserial2, superserial3]
      .entries()
  ) {
    const serialized = `[["AliasedArticle",[["Hello World!","Wow!",${index + 1}]]]]`;

    {
      const article = new TestArticle("Hello World!", "Wow!");
      assertEquals(superserial.serialize(article), serialized);
    }
    {
      const article = superserial.deserialize<TestArticle>(serialized);

      assertInstanceOf(article, TestArticle);
      assertEquals(article.title, "Hello World!");
      assertEquals(article.content, "Wow!");
      assertEquals((article as unknown as { index: number }).index, index + 1);
    }
  }
});

Deno.test("superserial, decorator", () => {
  const superserial = new Superserial({ decorator: true });

  const serialized = '[["TestUser",{"name":"Alice","age":20}]]';

  {
    const user = new TestUser("Alice");
    user.setAge(20);

    assertEquals(superserial.serialize(user), serialized);
  }
  {
    const user = superserial.deserialize<TestUser>(serialized);

    assertInstanceOf(user, TestUser);
    assertEquals(user.name, "Alice");
    assertEquals(user.getAge(), 20);
  }
  {
    @serializable({
      toSerialize: (value: TestComment) => ({ c: value.content }),
      toDeserialize: (value: { c: string }) => new TestComment(value.c),
    })
    class TestComment {
      constructor(public content: string) {}
    }
    const serialized = '[["TestComment",{"c":"hello world"}]]';
    const comment = new TestComment("hello world");

    assertEquals(superserial.serialize(comment), serialized);

    const deserialized = superserial.deserialize<TestComment>(serialized);
    assertInstanceOf(deserialized, TestComment);
    assertEquals(deserialized.content, "hello world");
  }
});
