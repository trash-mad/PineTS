// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

export function new_bool(context: any) {
    return (size: number = 0, initial_value: boolean = false): PineArrayObject => {
        const safeSize = (typeof size === 'number' && size > 0 && !isNaN(size)) ? Math.floor(size) : 0;
        return new PineArrayObject(Array(safeSize).fill(initial_value), PineArrayType.bool, context);
    };
}
