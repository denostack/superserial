import { assertEquals, assertInstanceOf } from "@std/assert";
import { Serializer, toDeserialize, toSerialize } from "./mod.ts";

Deno.test("serializer, toSerialize, toDeserialize", () => {
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

    assertEquals(
      serializer.serialize(user),
      'TestUser{"name":"wan2land","age":20}',
    );
  }
  {
    const user = serializer.deserialize<TestUser>(
      'TestUser{"name":"wan2land","age":20}',
    );

    assertInstanceOf(user, TestUser);
    assertEquals(user.name, "wan2land");
    assertEquals(user.getAge(), 20);
  }
});

Deno.test("serializer, alias class names", () => {
  class TestUser {
    constructor(public name: string) {
    }
  }

  const serializer = new Serializer({ classes: { AliasedTestUser: TestUser } });
  {
    const user = new TestUser("wan2land");

    assertEquals(
      serializer.serialize(user),
      'AliasedTestUser{"name":"wan2land"}',
    );
  }
  {
    const user = serializer.deserialize<TestUser>(
      'AliasedTestUser{"name":"wan2land"}',
    );

    assertInstanceOf(user, TestUser);
    assertEquals(user.name, "wan2land");
  }
});
