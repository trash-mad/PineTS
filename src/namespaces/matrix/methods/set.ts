// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';

export function set(context: Context) {
    return (id: PineMatrixObject, row: number, col: number, value: any) => {
        const rows = id.matrix.length;
        const cols = rows > 0 ? id.matrix[0].length : 0;
        if (row < 0 || row >= rows) {
            context.warn(
                `Row index ${row} is out of bounds, matrix has ${rows} rows.`,
                'matrix.set'
            );
            return;
        }
        if (col < 0 || col >= cols) {
            context.warn(
                `Column index ${col} is out of bounds, matrix has ${cols} columns.`,
                'matrix.set'
            );
            return;
        }
        id.matrix[row][col] = value;
    };
}
