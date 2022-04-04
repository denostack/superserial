"use strict";
// deno-lint-ignore-file no-explicit-any
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializer = void 0;
const serialize_1 = require("./serialize");
const deserialize_1 = require("./deserialize");
require("js-prototypes");
class Serializer {
    constructor(options) {
        this.options = {
            classes: {},
        };
        if (options)
            this.options = Object.assign(this.options, options);
    }
    serialize(value, options) {
        return serialize_1.serialize(value, options);
    }
    deserialize(code) {
        const opt = typeof this.options == 'object' ? this.options : {
            classes: {},
        };
        return deserialize_1.deserialize(code, opt);
    }
}
exports.Serializer = Serializer;
