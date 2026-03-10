// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

export function new_string(context: any) {
    return (size: number = 0, initial_value: string = ''): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.string, context);
    };
}
