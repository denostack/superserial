import 'js-prototypes';
import { ClassCallable } from 'js-prototypes/src/Function';
export interface DeserializeOptions {
    classes?: {
        [className: string]: ClassCallable;
    };
}
export declare function deserialize(code: string, options?: DeserializeOptions): any;
