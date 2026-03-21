// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';

export function row(context: Context) {
    return (id: PineMatrixObject, row: number) => {
        const rows = id.matrix.length;
        if (row < 0 || row >= rows) {
            context.warn(
                `Row index ${row} is out of bounds, matrix has ${rows} rows.`,
                'matrix.row'
            );
            const anyType = rows > 0 ? inferValueType(id.matrix[0][0]) : 'float';
            return new PineArrayObject([], anyType as any, context);
        }
        const rowType = inferValueType(id.matrix[row][0]);
        return new PineArrayObject([...id.matrix[row]], rowType as any, context);
    };
}
