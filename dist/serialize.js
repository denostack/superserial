"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serialize = void 0;
// deno-lint-ignore-file no-explicit-any
const symbol_1 = require("./symbol");
function serialize(value, options = {}) {
    let output = '';
    let inc = 0;
    const prettify = options.prettify ?? false;
    let depth = 0;
    const objectMap = new Map();
    const objectIndexMap = new Map();
    function _stringifyString(value) {
        output += `"${value.replace('"', '\\"')}"`; // " 문자는 escape 해야합니다.
        return true;
    }
    function _stringifyScalar(value) {
        if (value === null) {
            output += 'null';
            return true;
        }
        const typeofValue = typeof value;
        if (typeofValue === 'undefined') {
            output += 'undefined';
            return true;
        }
        if (typeofValue === 'number') {
            if (Number.isNaN(value)) {
                output += 'NaN';
                return true;
            }
            if (!Number.isFinite(value)) {
                output += value > 0 ? 'Infinity' : '-Infinity';
                return true;
            }
            output += `${value}`;
            return true;
        }
        if (typeofValue === 'bigint') {
            output += `${value}n`;
            return true;
        }
        if (typeofValue === 'boolean') {
            output += value ? 'true' : 'false';
            return true;
        }
        if (typeofValue === 'string') {
            return _stringifyString(value);
        }
        return false;
    }
    function _stringifyRoot(value) {
        if (_stringifyScalar(value)) {
            return true;
        }
        return _stringifyRef(value);
    }
    function _stringifyAny(value) {
        if (_stringifyScalar(value)) {
            return true;
        }
        let oIdx = objectIndexMap.get(value);
        if (typeof oIdx !== 'number') {
            oIdx = inc++;
            objectIndexMap.set(value, oIdx);
            objectMap.set(oIdx, value);
        }
        output += `$${oIdx}`;
        return true;
    }
    function _stringifyRef(value) {
        // simple :-)
        if (typeof value === 'symbol') {
            output += 'Symbol(';
            if (value.description) {
                _stringifyString(value.description);
            }
            output += ')';
            return true;
        }
        if (value instanceof RegExp) {
            output += value.toString();
            return true;
        }
        if (value instanceof Date) {
            output += 'Date(';
            _stringifyAny(value.getTime());
            output += ')';
            return true;
        }
        // complex :D
        if (prettify) {
            output += '  '.repeat(depth);
        }
        if (Array.isArray(value)) {
            _stringifyListStart('[');
            _stringifyList(value);
            _stringifyListEnd(']');
            return true;
        }
        if (value instanceof Map) {
            _stringifyListStart('Map(');
            _stringifyMap([...value.entries()]);
            _stringifyListEnd(')');
            return true;
        }
        if (value instanceof Set) {
            _stringifyListStart('Set(');
            _stringifyList([...value]);
            _stringifyListEnd(')');
            return true;
        }
        const name = value.constructor !== Object && value.constructor !== Function ? value.constructor.name : '';
        _stringifyListStart(prettify && name ? `${name} {` : `${name}{`);
        _stringifyKv(Object.entries(typeof value[symbol_1.toSerialize] === 'function' ? value[symbol_1.toSerialize]() : value));
        _stringifyListEnd('}');
        return true;
    }
    const _stringifyListStart = prettify
        ? (name) => {
            output += name;
            output += '\n';
            depth++;
        }
        : (name) => {
            output += name;
            depth++;
        };
    const _stringifyListEnd = prettify
        ? (name) => {
            depth--;
            output += '\n';
            output += '  '.repeat(depth);
            output += name;
        }
        : (name) => {
            depth--;
            output += name;
        };
    const _stringifyList = prettify
        ? (value) => {
            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    output += ',\n';
                }
                output += '  '.repeat(depth);
                _stringifyAny(value[i]);
            }
        }
        : (value) => {
            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    output += ',';
                }
                _stringifyAny(value[i]);
            }
        };
    const _stringifyMap = prettify
        ? (value) => {
            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    output += ',\n';
                }
                output += '  '.repeat(depth);
                _stringifyAny(value[i][0]);
                output += ' => ';
                _stringifyAny(value[i][1]);
            }
        }
        : (value) => {
            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    output += ',';
                }
                _stringifyAny(value[i][0]);
                output += '=>';
                _stringifyAny(value[i][1]);
            }
        };
    const _stringifyKv = prettify
        ? (value) => {
            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    output += ',\n';
                }
                output += '  '.repeat(depth);
                _stringifyString(value[i][0]);
                output += ': ';
                _stringifyAny(value[i][1]);
            }
        }
        : (value) => {
            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    output += ',';
                }
                _stringifyString(value[i][0]);
                output += ':';
                _stringifyAny(value[i][1]);
            }
        };
    inc++;
    objectIndexMap.set(value, 0);
    objectMap.set(0, value);
    _stringifyRoot(value);
    for (let i = 1; i < inc; i++) {
        output += ';';
        if (prettify) {
            output += '\n';
        }
        _stringifyRoot(objectMap.get(i));
    }
    return output;
}
exports.serialize = serialize;
