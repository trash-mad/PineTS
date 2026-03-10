// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { Context } from '../../../Context.class';

export function new_int(context: Context) {
    return (size: number = 0, initial_value: number = 0): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(context.precision(initial_value)), PineArrayType.int, context);
    };
}
