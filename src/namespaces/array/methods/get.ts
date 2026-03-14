// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { PineRuntimeError } from '../../../errors/PineRuntimeError';

export function get(context: any) {
    return (id: PineArrayObject, index: number) => {
        // Pine Script v6: negative indices count backwards from the end.
        // -1 = last element, -array.size() = first element.
        if (index < 0) index = id.array.length + index;
        // Bounds check: throw PineRuntimeError for out-of-bounds access.
        // Matches TradingView behavior where out-of-bounds array.get() throws a runtime error.
        if (index < 0 || index >= id.array.length) {
            throw new PineRuntimeError(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.get'
            );
        }
        return id.array[index];
    };
}
