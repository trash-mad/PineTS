// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { isValueOfType } from '../utils';

export function insert(context: any) {
    return (id: PineArrayObject, index: number, value: any): void => {
        if (!isValueOfType(value, id.type)) {
            throw new Error(
                `Cannot call 'array.insert' with argument 'value'='${value}'. An argument of 'literal ${typeof value}' type was used but a '${
                    id.type
                }' is expected.`
            );
        }
        // Pine Script v6: negative indices count backwards from the end.
        if (index < 0) index = id.array.length + index;
        // For insert, valid indices are 0 to array.length (inclusive — insert at end is valid).
        if (index < 0 || index > id.array.length) {
            context.warn(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.insert'
            );
            return;
        }
        id.array.splice(index, 0, value);
    };
}
