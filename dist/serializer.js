"use strict";
// deno-lint-ignore-file no-explicit-any
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializer = void 0;
const serialize_1 = require("./serialize");
const deserialize_1 = require("./deserialize");
class Serializer {
    constructor(options) {
        this.options = {
            classes: {},
        };
        if (options)
            this.options = Object.assign(this.options, options);
    }
    serialize(value, options) {
        return (0, serialize_1.serialize)(value, options);
    }
    deserialize(code) {
        return (0, deserialize_1.deserialize)(code, this.options);
    }
}
exports.Serializer = Serializer;
