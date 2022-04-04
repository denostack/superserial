import { SerializeOptions } from './serialize';
import { ClassCallable } from 'js-prototypes/dist/libs/Function';
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
