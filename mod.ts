/**
 * Serializer/Deserializer that supports everything you can imagine.
 *
 * ### Example
 *
 * ```ts
 * import { Serializer } from "https://deno.land/x/superserial/mod.ts";
 *
 * const serializer = new Serializer();
 *
 * const data = new Set();
 * data.add(data); // set referencing itself
 *
 * const serialized = serializer.serialize(data);
 *
 * console.log(serialized); // Set($0)
 * ```
 *
 * @module
 */

export { Serializer, type SerializerOptions } from "./serializer.ts";

export { serialize, type SerializeOptions } from "./serialize.ts";
export { deserialize, type DeserializeOptions } from "./deserialize.ts";

export { toDeserialize, toSerialize } from "./symbol.ts";
