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

export type { ConstructType } from "./types.ts";
export { toDeserialize, toSerialize } from "./constants.ts";

export { type Reducer, serialize } from "./serialize.ts";
export { deserialize, type Reviver } from "./deserialize.ts";

import { Superserial } from "./superserial.ts";
export {
  type ClassDefinition,
  type DefineClassOptions,
  Superserial,
  type SuperserialOptions,
} from "./superserial.ts";

export default Superserial;
