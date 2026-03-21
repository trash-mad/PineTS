// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Array Negative Index Tests (Pine Script v6 semantics)
 *
 * Pine Script v6 supports negative indices for array methods:
 * -1 = last element, -array.size() = first element.
 * Indices beyond -array.size() are out of bounds and throw PineRuntimeError.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Array Negative Index (v6 semantics)', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-05').getTime();

    // -- array.get --

    describe('array.get', () => {
        it('should return last element for index -1', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(10, 20, 30, 40, 50);
                plotchar(array.get(a, -1), 'val');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['val'].data[0].value).toBe(50);
        });

        it('should return first element for index -length', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(10, 20, 30, 40, 50);
                plotchar(array.get(a, -5), 'val');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['val'].data[0].value).toBe(10);
        });

        it('should return middle elements for intermediate negative indices', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(10, 20, 30, 40, 50);
                plotchar(array.get(a, -2), 'neg2');
                plotchar(array.get(a, -3), 'neg3');
                plotchar(array.get(a, -4), 'neg4');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['neg2'].data[0].value).toBe(40);
            expect(plots['neg3'].data[0].value).toBe(30);
            expect(plots['neg4'].data[0].value).toBe(20);
        });

        it('should return NaN and warn for negative index beyond bounds', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, na, plotchar } = context.pine;
                let a = array.from(10, 20, 30);
                let oob = array.get(a, -4);
                plotchar(na(oob) ? 1 : 0, 'isNa');
            `;
            const ctx = await pineTS.run(code);
            expect(ctx.plots['isNa'].data[0].value).toBe(1);
            expect(ctx.warnings.length).toBeGreaterThan(0);
        });

        it('should return NaN and warn for negative index on empty array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, na, plotchar } = context.pine;
                let a = array.new_float(0);
                let val = array.get(a, -1);
                plotchar(na(val) ? 1 : 0, 'isNa');
            `;
            const ctx = await pineTS.run(code);
            expect(ctx.plots['isNa'].data[0].value).toBe(1);
            expect(ctx.warnings.length).toBeGreaterThan(0);
        });

        it('should work with method syntax (a.get(-1))', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(100, 200, 300);
                plotchar(a.get(-1), 'val');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['val'].data[0].value).toBe(300);
        });

        it('should work with single-element array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(42);
                plotchar(array.get(a, -1), 'neg1');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['neg1'].data[0].value).toBe(42);
        });

        it('should return NaN and warn for OOB on single-element array', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, na, plotchar } = context.pine;
                let a = array.from(42);
                let oob = array.get(a, -2);
                plotchar(na(oob) ? 1 : 0, 'oobNa');
            `;
            const ctx = await pineTS.run(code);
            expect(ctx.plots['oobNa'].data[0].value).toBe(1);
        });
    });

    // -- array.set --

    describe('array.set', () => {
        it('should set last element with index -1', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(1, 2, 3, 4, 5);
                array.set(a, -1, 99);
                plotchar(array.get(a, 4), 'val');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['val'].data[0].value).toBe(99);
        });

        it('should set first element with index -length', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(1, 2, 3);
                array.set(a, -3, 77);
                plotchar(array.get(a, 0), 'val');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['val'].data[0].value).toBe(77);
        });

        it('should warn for out-of-bounds negative index (no-op)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(1, 2, 3);
                array.set(a, -4, 99);
                plotchar(array.get(a, 0), 'v0');
                plotchar(array.size(a), 'size');
            `;
            const ctx = await pineTS.run(code);
            expect(ctx.plots['v0'].data[0].value).toBe(1);  // unchanged
            expect(ctx.plots['size'].data[0].value).toBe(3); // unchanged
            expect(ctx.warnings.some((w: any) => w.method === 'array.set')).toBe(true);
        });
    });

    // -- array.remove --

    describe('array.remove', () => {
        it('should remove last element with index -1', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(100, 200, 300, 400);
                let removed = array.remove(a, -1);
                plotchar(removed, 'removed');
                plotchar(array.size(a), 'size');
                plotchar(array.last(a), 'last');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['removed'].data[0].value).toBe(400);
            expect(plots['size'].data[0].value).toBe(3);
            expect(plots['last'].data[0].value).toBe(300);
        });

        it('should remove first element with index -length', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(10, 20, 30);
                let removed = array.remove(a, -3);
                plotchar(removed, 'removed');
                plotchar(array.size(a), 'size');
                plotchar(array.first(a), 'first');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['removed'].data[0].value).toBe(10);
            expect(plots['size'].data[0].value).toBe(2);
            expect(plots['first'].data[0].value).toBe(20);
        });

        it('should warn for out-of-bounds negative index remove', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, na, plotchar } = context.pine;
                let a = array.from(10, 20, 30);
                let removed = array.remove(a, -4);
                plotchar(na(removed) ? 1 : 0, 'isNa');
                plotchar(array.size(a), 'size');
            `;
            const ctx = await pineTS.run(code);
            expect(ctx.plots['isNa'].data[0].value).toBe(1);
            expect(ctx.plots['size'].data[0].value).toBe(3); // unchanged
            expect(ctx.warnings.some((w: any) => w.method === 'array.remove')).toBe(true);
        });
    });

    // -- array.insert --

    describe('array.insert', () => {
        it('should insert before last element with index -1', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(10, 20, 30);
                array.insert(a, -1, 25);
                plotchar(array.size(a), 'size');
                plotchar(array.get(a, 0), 'v0');
                plotchar(array.get(a, 1), 'v1');
                plotchar(array.get(a, 2), 'v2');
                plotchar(array.get(a, 3), 'v3');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(4);
            expect(plots['v0'].data[0].value).toBe(10);
            expect(plots['v1'].data[0].value).toBe(20);
            expect(plots['v2'].data[0].value).toBe(25);
            expect(plots['v3'].data[0].value).toBe(30);
        });

        it('should insert at beginning with index -length', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(10, 20, 30);
                array.insert(a, -3, 5);
                plotchar(array.size(a), 'size');
                plotchar(array.first(a), 'first');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['size'].data[0].value).toBe(4);
            expect(plots['first'].data[0].value).toBe(5);
        });
    });

    // -- mixed operations --

    describe('mixed operations', () => {
        it('should handle sequential negative-index operations', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = `
                const { array, plotchar } = context.pine;
                let a = array.from(1, 2, 3, 4, 5);
                array.set(a, -1, 50);
                let secondLast = array.get(a, -2);
                let removed = array.remove(a, -1);
                let newLast = array.get(a, -1);
                plotchar(secondLast, 'secondLast');
                plotchar(removed, 'removed');
                plotchar(newLast, 'newLast');
                plotchar(array.size(a), 'size');
            `;
            const { plots } = await pineTS.run(code);
            expect(plots['secondLast'].data[0].value).toBe(4);
            expect(plots['removed'].data[0].value).toBe(50);
            expect(plots['newLast'].data[0].value).toBe(4);
            expect(plots['size'].data[0].value).toBe(4);
        });
    });
});
