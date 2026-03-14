// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Runtime error thrown by PineTS when a Pine Script runtime violation occurs.
 * Mirrors TradingView behavior where operations like out-of-bounds array/matrix
 * access or infinite loops halt the script with a runtime error.
 *
 * Consumers can catch this specific error type to distinguish Pine runtime
 * errors from general JavaScript errors:
 *
 * ```typescript
 * try {
 *     const result = await pineTS.run(code);
 * } catch (err) {
 *     if (err instanceof PineRuntimeError) {
 *         console.log('Pine runtime error:', err.message);
 *         console.log('Method:', err.method); // e.g. 'array.get'
 *     }
 * }
 * ```
 */
export class PineRuntimeError extends Error {
    /**
     * The Pine Script method that caused the error (e.g. 'array.get', 'matrix.set').
     * May be undefined for non-method errors (e.g. loop guard).
     */
    public method?: string;

    constructor(message: string, method?: string) {
        super(message);
        this.name = 'PineRuntimeError';
        this.method = method;
    }
}
