// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { inferArrayType, inferValueType } from '../utils';
import { Context } from '../../../Context.class';

export function new_fn(context: Context) {
    return <T>(size?: number, initial_value?: T): PineArrayObject => {
        // When called with no arguments (e.g. array.new<chart.point>()),
        // create an untyped array that accepts any value.
        if (size === undefined && initial_value === undefined) {
            return new PineArrayObject([], PineArrayType.any, context);
        }
        return new PineArrayObject(
            Array(size).fill(context.precision((initial_value as number) || 0)),
            inferValueType((initial_value as any) || 0),
            context
        );
    };
}
