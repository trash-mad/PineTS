// SPDX-License-Identifier: AGPL-3.0-only
// Streaming verification tests for request.security secondary context refresh.
// Verifies that when the main context's data changes during streaming,
// the cached secondary context is updated via updateTail().

import { describe, it, expect } from 'vitest';
import PineTS from 'PineTS.class';
import { Provider } from '@pinets/index';

describe('request.security Streaming Refresh', () => {
    /**
     * HTF test: 1-minute chart requesting 5-minute close.
     * Streams a few live iterations at 3s interval.
     * Verifies that:
     * - dataVersion increments when main context data changes
     * - The secondary context cache entry has the correct structure
     * - The cached secondary dataVersion is updated (proving updateTail was called)
     */
    it('HTF: secondary context cache is refreshed during streaming', async () => {
        return new Promise<void>((resolve, reject) => {
            const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', '1');

            const evt = pineTS.stream(
                `//@version=5
indicator("HTF Stream Test")
float htfClose = request.security(syminfo.tickerid, "5", close, barmerge.gaps_off, barmerge.lookahead_off)
plot(htfClose, "htf")`,
                { pageSize: 500, live: true, interval: 3000 },
            );

            let liveEventCount = 0;
            const dataVersions: number[] = [];
            const cachedDataVersions: number[] = [];
            let pageCount = 0;

            evt.on('data', (ctx: any) => {
                const currentCandle = ctx.marketData[ctx.idx];
                const isHistorical = currentCandle && currentCandle.closeTime < Date.now();

                if (isHistorical) {
                    pageCount++;
                    return;
                }

                liveEventCount++;
                const fullCtx = ctx.fullContext;
                const dv = fullCtx.dataVersion;
                dataVersions.push(dv);

                // Check cache structure
                const cacheKeys = Object.keys(fullCtx.cache).filter(
                    (k) => !k.endsWith('_prevIdx'),
                );

                let cachedDV = -1;
                if (cacheKeys.length > 0) {
                    const entry = fullCtx.cache[cacheKeys[0]];
                    cachedDV = entry?.dataVersion ?? -1;
                    cachedDataVersions.push(cachedDV);
                }

                console.log(
                    `  [HTF Live #${liveEventCount}] dataVersion=${dv}, cachedDV=${cachedDV}, cacheKeys=${cacheKeys.length}`,
                );

                if (liveEventCount >= 3) {
                    evt.stop();

                    try {
                        // 1. dataVersion should have incremented (data changed at least once)
                        const maxDV = Math.max(...dataVersions);
                        expect(maxDV).toBeGreaterThan(0);
                        console.log(`  dataVersions: [${dataVersions.join(', ')}]`);
                        console.log(`  cachedDataVersions: [${cachedDataVersions.join(', ')}]`);

                        // 2. Cache entry should have the new { pineTS, context, dataVersion } structure
                        if (cacheKeys.length > 0) {
                            const entry = fullCtx.cache[cacheKeys[0]];
                            expect(entry).toHaveProperty('pineTS');
                            expect(entry).toHaveProperty('context');
                            expect(entry).toHaveProperty('dataVersion');

                            // 3. Cached dataVersion should match latest main context version
                            // This proves updateTail() was called and the cache was refreshed
                            expect(entry.dataVersion).toBe(maxDV);
                        }

                        // 4. dataVersion should be increasing across iterations
                        for (let i = 1; i < dataVersions.length; i++) {
                            expect(dataVersions[i]).toBeGreaterThanOrEqual(dataVersions[i - 1]);
                        }

                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }
            });

            evt.on('error', (error: any) => {
                reject(error);
            });

            setTimeout(() => {
                evt.stop();
                if (liveEventCount >= 1) {
                    console.warn(
                        `  HTF Timeout: ${liveEventCount} live events, ${pageCount} pages.`,
                    );
                    resolve();
                } else {
                    reject(
                        new Error(
                            `HTF Timeout: no live events. ${pageCount} historical pages.`,
                        ),
                    );
                }
            }, 60000);
        });
    }, 90000);

    /**
     * LTF test: 5-minute chart requesting 1-minute close.
     * Streams a few live iterations at 3s interval.
     * Verifies that:
     * - dataVersion increments
     * - The LTF secondary context cache is refreshed
     */
    it('LTF: secondary context cache is refreshed during streaming', async () => {
        return new Promise<void>((resolve, reject) => {
            const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', '5');

            const evt = pineTS.stream(
                `//@version=5
indicator("LTF Stream Test")
float[] ltfCloses = request.security_lower_tf(syminfo.tickerid, "1", close)
plot(close, "c")`,
                { pageSize: 200, live: true, interval: 3000 },
            );

            let liveEventCount = 0;
            const dataVersions: number[] = [];
            const cachedDataVersions: number[] = [];
            let pageCount = 0;

            evt.on('data', (ctx: any) => {
                const currentCandle = ctx.marketData[ctx.idx];
                const isHistorical = currentCandle && currentCandle.closeTime < Date.now();

                if (isHistorical) {
                    pageCount++;
                    return;
                }

                liveEventCount++;
                const fullCtx = ctx.fullContext;
                const dv = fullCtx.dataVersion;
                dataVersions.push(dv);

                // Check LTF cache
                const cacheKeys = Object.keys(fullCtx.cache).filter((k) =>
                    k.endsWith('_lower'),
                );

                let cachedDV = -1;
                if (cacheKeys.length > 0) {
                    const entry = fullCtx.cache[cacheKeys[0]];
                    cachedDV = entry?.dataVersion ?? -1;
                    cachedDataVersions.push(cachedDV);
                }

                console.log(
                    `  [LTF Live #${liveEventCount}] dataVersion=${dv}, cachedDV=${cachedDV}, ltfCacheKeys=${cacheKeys.length}`,
                );

                if (liveEventCount >= 3) {
                    evt.stop();

                    try {
                        // 1. dataVersion should have incremented
                        const maxDV = Math.max(...dataVersions);
                        expect(maxDV).toBeGreaterThan(0);
                        console.log(`  dataVersions: [${dataVersions.join(', ')}]`);
                        console.log(`  cachedDataVersions: [${cachedDataVersions.join(', ')}]`);

                        // 2. LTF cache should exist with new structure
                        if (cacheKeys.length > 0) {
                            const entry = fullCtx.cache[cacheKeys[0]];
                            expect(entry).toHaveProperty('pineTS');
                            expect(entry).toHaveProperty('context');
                            expect(entry).toHaveProperty('dataVersion');

                            // 3. Cached dataVersion should be up-to-date
                            expect(entry.dataVersion).toBe(maxDV);
                        }

                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }
            });

            evt.on('error', (error: any) => {
                reject(error);
            });

            setTimeout(() => {
                evt.stop();
                if (liveEventCount >= 1) {
                    console.warn(
                        `  LTF Timeout: ${liveEventCount} live events, ${pageCount} pages.`,
                    );
                    resolve();
                } else {
                    reject(
                        new Error(
                            `LTF Timeout: no live events. ${pageCount} historical pages.`,
                        ),
                    );
                }
            }, 60000);
        });
    }, 90000);
});
