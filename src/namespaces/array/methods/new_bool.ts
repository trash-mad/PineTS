// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

export function new_bool(context: any) {
    return (size: number = 0, initial_value: boolean = false): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.bool, context);
    };
}
