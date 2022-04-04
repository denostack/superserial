import { SerializeOptions } from './serialize';
import 'js-prototypes';
import { ClassCallable } from 'js-prototypes/src/Function';
export interface SerializerOptions {
    classes?: {
        [className: string]: ClassCallable;
    };
}
export declare class Serializer {
    options: SerializerOptions;
    constructor(options?: SerializerOptions);
    serialize(value: any, options?: SerializeOptions): string;
    deserialize<T = any>(code: string): T;
}
