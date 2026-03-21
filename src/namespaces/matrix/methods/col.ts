// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';

export function col(context: Context) {
    return (id: PineMatrixObject, column: number) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        if (column < 0 || column >= cols) {
            context.warn(
                `Column index ${column} is out of bounds, matrix has ${cols} columns.`,
                'matrix.col'
            );
            const anyType = rows > 0 ? inferValueType(id.matrix[0][0]) : 'float';
            return new PineArrayObject([], anyType as any, context);
        }
        const result = [];
        for (let i = 0; i < rows; i++) {
            result.push(id.matrix[i][column]);
        }
        const columnType = inferValueType(result[0]);
        return new PineArrayObject(result, columnType as any, context);
    };
}
