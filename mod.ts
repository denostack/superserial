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

export { serialize } from "./serialize.ts";
export { deserialize } from "./deserialize.ts";

export { toDeserialize, toSerialize } from "./symbol.ts";
