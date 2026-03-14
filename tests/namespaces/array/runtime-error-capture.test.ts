// SPDX-License-Identifier: AGPL-3.0-only

/**
 * PineRuntimeError Capture Tests
 *
 * Verifies that PineRuntimeError is correctly thrown and can be captured
 * through both the run() (Promise) and stream() (event-based) APIs.
 */

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';
import { PineRuntimeError } from '../../../src/errors/PineRuntimeError';

describe('PineRuntimeError Capture', () => {
    const startDate = new Date('2024-01-01').getTime();
    const endDate = new Date('2024-01-05').getTime();

    // -- run() API (Promise-based) --

    describe('run() API', () => {
        it('should throw PineRuntimeError on array OOB via try/catch', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.get(arr, 10);  // OOB
            };

            try {
                await pineTS.run(code);
                expect.unreachable('Should have thrown');
            } catch (err) {
                expect(err).toBeInstanceOf(PineRuntimeError);
                expect((err as PineRuntimeError).name).toBe('PineRuntimeError');
                expect((err as PineRuntimeError).method).toBe('array.get');
                expect((err as PineRuntimeError).message).toContain('out of bounds');
            }
        });

        it('should reject with PineRuntimeError on array.set OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.set(arr, 5, 42);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('should reject with PineRuntimeError on array.remove OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.remove(arr, 5);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('should reject with PineRuntimeError on array.insert OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.insert(arr, -5, 42);  // -5 on length-3 array
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('should reject with PineRuntimeError on matrix.get OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { matrix } = context.pine;
                const m = matrix.new(3, 3, 0);
                matrix.get(m, 5, 0);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('should reject with PineRuntimeError on matrix.set OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { matrix } = context.pine;
                const m = matrix.new(3, 3, 0);
                matrix.set(m, 0, 5, 42);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('should reject with PineRuntimeError on matrix.row OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { matrix } = context.pine;
                const m = matrix.new(3, 3, 0);
                matrix.row(m, 5);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('should reject with PineRuntimeError on matrix.col OOB', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            const code = (context: any) => {
                const { matrix } = context.pine;
                const m = matrix.new(3, 3, 0);
                matrix.col(m, 5);
            };

            await expect(pineTS.run(code)).rejects.toThrow(PineRuntimeError);
        });

        it('should reject with PineRuntimeError on loop guard violation', async () => {
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

    // -- stream() API (event-based) --

    describe('stream() API', () => {
        it('should emit PineRuntimeError on array OOB via error event', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            await pineTS.ready(); // Ensure data is loaded so pageSize is non-zero
            const code = (context: any) => {
                const { array } = context.pine;
                const arr = array.new_float(3, 100);
                array.get(arr, 10);  // OOB
            };

            const error = await new Promise<any>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout waiting for error event')), 5000);

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    resolve(err);
                });

                stream.on('data', () => {
                    clearTimeout(timeout);
                    reject(new Error('Should not emit data'));
                });
            });

            expect(error).toBeInstanceOf(PineRuntimeError);
            expect(error.name).toBe('PineRuntimeError');
            expect(error.method).toBe('array.get');
            expect(error.message).toContain('out of bounds');
        });

        it('should emit PineRuntimeError on matrix OOB via error event', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);
            await pineTS.ready();
            const code = (context: any) => {
                const { matrix } = context.pine;
                const m = matrix.new(2, 2, 0);
                matrix.get(m, 10, 0);
            };

            const error = await new Promise<any>((resolve, reject) => {
                const stream = pineTS.stream(code, { live: false });
                const timeout = setTimeout(() => reject(new Error('Timeout waiting for error event')), 5000);

                stream.on('error', (err: any) => {
                    clearTimeout(timeout);
                    resolve(err);
                });

                stream.on('data', () => {
                    clearTimeout(timeout);
                    reject(new Error('Should not emit data'));
                });
            });

            expect(error).toBeInstanceOf(PineRuntimeError);
            expect(error.method).toBe('matrix.get');
        });

        it('should emit error on loop guard violation via stream', async () => {
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
                const timeout = setTimeout(() => reject(new Error('Timeout waiting for error event')), 5000);

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
