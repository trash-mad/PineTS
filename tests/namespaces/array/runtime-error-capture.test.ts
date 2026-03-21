// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Runtime Warning / Error Capture Tests
 *
 * Verifies that:
 * - Array/matrix OOB emits non-blocking warnings (script continues, returns na)
 * - Warnings are accessible via context.warnings after run()
 * - Warnings are emitted via 'warning' event in stream()
 * - Loop guard violations still throw (blocking errors)
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Runtime Warning / Error Capture', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-05').getTime();

    // -- run() API: warnings --

    describe('run() API - OOB warnings', () => {
        it('array.get OOB emits warning and returns na', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                return array.get(arr, 10);
            };

            const ctx = await pineTS.run(code);
            // Script continues — result is NaN (na)
            expect(ctx.result[0]).toBeNaN();
            // Warning is captured
            expect(ctx.warnings.length).toBeGreaterThan(0);
            expect(ctx.warnings[0].method).toBe('array.get');
            expect(ctx.warnings[0].message).toContain('out of bounds');
        });

        it('array.set OOB emits warning (no-op)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.set(arr, 5, 42);
                return array.get(arr, 0); // original value unchanged
            };

            const ctx = await pineTS.run(code);
            expect(ctx.result[0]).toBe(100);
            expect(ctx.warnings.some((w: any) => w.method === 'array.set')).toBe(true);
        });

        it('array.remove OOB emits warning and returns na', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                return array.remove(arr, 5);
            };

            const ctx = await pineTS.run(code);
            expect(ctx.result[0]).toBeNaN();
            expect(ctx.warnings.some((w: any) => w.method === 'array.remove')).toBe(true);
        });

        it('matrix.get OOB emits warning and returns na', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { matrix } = context.pine;
                const m = matrix.new(3, 3, 0);
                return matrix.get(m, 5, 0);
            };

            const ctx = await pineTS.run(code);
            expect(ctx.result[0]).toBeNaN();
            expect(ctx.warnings.some((w: any) => w.method === 'matrix.get')).toBe(true);
        });

        it('loop guard violation still throws (blocking)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            pineTS.setMaxLoops(10);

            const code = `
//@version=6
indicator("Loop Guard Test")
i = 0
while true
    i += 1
plot(i)
            `;

            await expect(pineTS.run(code)).rejects.toThrow(/loop/i);
        });
    });

    // -- stream() API: warning events --

    describe('stream() API - warning events', () => {
        it('emits warning event on array OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            await pineTS.ready();
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.get(arr, 10);
            };

            const warnings: any[] = [];
            let dataReceived = false;

            await new Promise<void>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

                stream.on('data', () => {
                    dataReceived = true;
                    clearTimeout(timeout);
                    resolve();
                });

                stream.on('warning', (w: any) => {
                    warnings.push(w);
                });

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });

            expect(dataReceived).toBe(true); // Script continues despite OOB
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].method).toBe('array.get');
        });

        it('loop guard still emits error event (blocking)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            await pineTS.ready();
            pineTS.setMaxLoops(10);

            const code = `
//@version=6
indicator("Loop Guard Test")
i = 0
while true
    i += 1
plot(i)
            `;

            const error = await new Promise<any>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    resolve(err);
                });

                stream.on('data', () => {
                    clearTimeout(timeout);
                    reject(new Error('Should not emit data'));
                });
            });

            expect(error).toBeInstanceOf(Error);
            expect(error.message).toMatch(/loop/i);
        });
    });
});
