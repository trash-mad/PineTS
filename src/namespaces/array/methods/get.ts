// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function get(context: any) {
    return (id: PineArrayObject, index: number) => {
        // Pine Script v6: negative indices count backwards from the end.
        // -1 = last element, -array.size() = first element.
        if (index < 0) index = id.array.length + index;
        // Bounds check: warn and return NaN (Pine's na) for out-of-bounds access.
        // TradingView throws a runtime error, but PineTS emits a non-blocking
        // warning so partial results are still available.
        if (index < 0 || index >= id.array.length) {
            context.warn(
                `Index ${index} is out of bounds, array size is ${id.array.length}.`,
                'array.get'
            );
            return NaN;
        }
        return id.array[index];
    };
}
