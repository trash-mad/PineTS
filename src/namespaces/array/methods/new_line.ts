// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';

export function new_line(context: any) {
    return (size: number = 0, initial_value: any = null): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(initial_value), PineArrayType.line, context);
    };
}
