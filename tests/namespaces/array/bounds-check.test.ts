// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Array.get Bounds Checking Tests
 *
 * Tests that out-of-bounds array access throws PineRuntimeError,
 * matching TradingView behavior where out-of-bounds access halts the script.
 */

import { describe, it, expect } from 'vitest';
import PineTS from '../../../src/PineTS.class';
import { Provider } from '../../../src/marketData/Provider.class';
import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';

describe('Array.get Bounds Checking', () => {
    const sDate = new Date('2024-01-01').getTime();
    const eDate = new Date('2024-01-02').getTime();

    it('should resolve negative index from end (Pine v6 semantics)', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(3, 100);
            const val = array.get(arr, -1);    // last element
            const val2 = array.get(arr, -3);   // first element

            return { val, val2 };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.val)).toBe(100);   // -1 -> last element
        expect(last(result.val2)).toBe(100);  // -3 -> first element
    });

    it('should throw PineRuntimeError for negative index beyond bounds', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(3, 100);
            array.get(arr, -4);    // out of bounds (beyond first)
        };

        await expect(pineTS.run(sourceCode)).rejects.toThrow(PineRuntimeError);
    });

    it('should throw PineRuntimeError for index >= array length', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode1 = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            array.get(arr, 3);    // index == length
        };

        const sourceCode2 = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            array.get(arr, 10);   // index > length
        };

        await expect(pineTS.run(sourceCode1)).rejects.toThrow(PineRuntimeError);

        const pineTS2 = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);
        await expect(pineTS2.run(sourceCode2)).rejects.toThrow(PineRuntimeError);
    });

    it('should return correct value for valid index', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(0);
            array.push(arr, 10);
            array.push(arr, 20);
            array.push(arr, 30);

            const first = array.get(arr, 0);
            const mid = array.get(arr, 1);
            const last_val = array.get(arr, 2);

            return { first, mid, last_val };
        };

        const { result } = await pineTS.run(sourceCode);
        const last = (arr: any[]) => arr[arr.length - 1];

        expect(last(result.first)).toBe(10);
        expect(last(result.mid)).toBe(20);
        expect(last(result.last_val)).toBe(30);
    });

    it('should throw PineRuntimeError for empty array access', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_float(0);
            array.get(arr, 0);
        };

        await expect(pineTS.run(sourceCode)).rejects.toThrow(PineRuntimeError);
    });

    it('should throw PineRuntimeError using method syntax (arr.get())', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;

            const arr = array.new_int(5, 42);
            const valid = arr.get(2);
            arr.get(10);  // should throw
        };

        await expect(pineTS.run(sourceCode)).rejects.toThrow(PineRuntimeError);
    });

    it('should include method name in PineRuntimeError', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, sDate, eDate);

        const sourceCode = (context: any) => {
            const { array } = context.pine;
            const arr = array.new_float(3, 100);
            array.get(arr, 5);
        };

        try {
            await pineTS.run(sourceCode);
            expect.unreachable('Should have thrown');
        } catch (err) {
            expect(err).toBeInstanceOf(PineRuntimeError);
            expect((err as PineRuntimeError).method).toBe('array.get');
            expect((err as PineRuntimeError).message).toContain('out of bounds');
        }
    });
});
