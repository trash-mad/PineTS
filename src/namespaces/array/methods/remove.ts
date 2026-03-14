// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function remove(context: any) {
    return (id: PineArrayObject, index: number): any => {
        // Pine Script v6: negative indices count backwards from the end.
        if (index < 0) index = id.array.length + index;
        if (index < 0 || index >= id.array.length) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.remove'
            );
        }
        return id.array.splice(index, 1)[0];
    };
}
