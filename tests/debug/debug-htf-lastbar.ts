/**
 * Debug script: Verify HTF last-bar fix on 1h timeframe.
 *
 * Usage: cd PineTS && npx tsx --tsconfig tsconfig.json tests/debug/debug-htf-lastbar.ts
 */

import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

const TAIL_BARS = 30;

async function main() {
    const sDate = new Date('2026-02-24').getTime();
    const pineTS = new PineTS(Provider.Binance, 'BTCUSDC', '60', undefined, sDate);

    const ctx = await pineTS.run(
`//@version=5
indicator("HTF Debug")
float wkHigh  = request.security(syminfo.tickerid, "W", high, barmerge.gaps_off, barmerge.lookahead_off)
float wkLow   = request.security(syminfo.tickerid, "W", low, barmerge.gaps_off, barmerge.lookahead_off)
float wkClose = request.security(syminfo.tickerid, "W", close, barmerge.gaps_off, barmerge.lookahead_off)
plot(wkHigh, "wkHigh")
plot(wkLow, "wkLow")
plot(wkClose, "wkClose")
`) as any;

    const totalBars = ctx.data.close.data.length;
    const start = Math.max(0, totalBars - TAIL_BARS);

    // Extract plot values from plot data objects
    const wkHighData = ctx.plots['wkHigh'].data;
    const wkLowData = ctx.plots['wkLow'].data;
    const wkCloseData = ctx.plots['wkClose'].data;

    // Get secondary context for reference
    const cacheKeys = Object.keys(ctx.cache).filter(k => !k.endsWith('_prevIdx'));
    const cached0 = ctx.cache[cacheKeys[0]];
    const secCtx = cached0.context || cached0;
    const secOpenTimes = secCtx.data?.openTime?.data || [];
    const secCloseTimes = secCtx.data?.closeTime?.data || [];

    // Show weekly bars
    console.log(`=== Secondary context (Weekly bars): ${secOpenTimes.length} bars ===`);
    for (let j = 0; j < secOpenTimes.length; j++) {
        const ot = new Date(secOpenTimes[j]).toISOString().slice(0, 10);
        const ct = new Date(secCloseTimes[j]).toISOString().slice(0, 10);
        const isCurrent = secCloseTimes[j] > Date.now() ? ' ◄ CURRENT' : '';
        const vals: string[] = [];
        for (const ck of cacheKeys) {
            const sc = (ctx.cache[ck].context || ctx.cache[ck]);
            const exprKey = ck.split('_').pop()!;
            vals.push(String(sc.params[exprKey]?.[j] ?? 'N/A'));
        }
        console.log(`  [${j}] ${ot} → ${ct} | high=${vals[0]} | low=${vals[1]} | close=${vals[2]}${isCurrent}`);
    }

    // Show last N hourly bars
    console.log(`\n=== Last ${totalBars - start} hourly bars: PineTS output ===`);
    console.log('bar  | time                 | wkHigh       | wkLow        | wkClose      | week');
    console.log('-----|----------------------|--------------|--------------|--------------|------');

    let prevHigh: number | null = null;
    for (let i = start; i < totalBars; i++) {
        const myOpenTime = ctx.data.openTime.data[i];
        const myCloseTime = ctx.data.closeTime.data[i];
        const time = new Date(myOpenTime).toISOString().replace('T', ' ').slice(0, 16);

        const h = wkHighData[i]?.value;
        const l = wkLowData[i]?.value;
        const c = wkCloseData[i]?.value;

        // Which weekly bar
        let weekIdx = -1;
        let isOpenWeek = false;
        for (let j = 0; j < secOpenTimes.length; j++) {
            if (secOpenTimes[j] <= myOpenTime && myOpenTime < secCloseTimes[j]) {
                weekIdx = j;
                isOpenWeek = secCloseTimes[j] > Date.now();
                break;
            }
        }

        const isLast = i === totalBars - 1;
        const isRealtime = isLast && myCloseTime > Date.now();
        const changed = prevHigh !== null && h !== prevHigh ? ' ◄ VALUE CHANGED' : '';
        const marker = isRealtime ? ' ◄ REALTIME' : (isLast ? ' ◄ LAST' : '');

        console.log(
            `${String(i).padStart(4)} | ${time} | ${String(h ?? 'NaN').padStart(12)} | ${String(l ?? 'NaN').padStart(12)} | ${String(c ?? 'NaN').padStart(12)} | wk${weekIdx}${isOpenWeek ? '(open)' : ''}${marker}${changed}`
        );
        prevHigh = h;
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total bars: ${totalBars}, last bar closeTime: ${new Date(ctx.data.closeTime.data[totalBars - 1]).toISOString()}`);
    console.log(`Current time: ${new Date().toISOString()}`);
    console.log(`Last bar is realtime: ${ctx.data.closeTime.data[totalBars - 1] > Date.now()}`);

    // Highlight the fix
    const lastH = wkHighData[totalBars - 1]?.value;
    const prevH = wkHighData[totalBars - 2]?.value;
    console.log(`\nSecond-to-last bar wkHigh: ${prevH} (should be prev week = 70023.8)`);
    console.log(`Last bar (realtime) wkHigh: ${lastH} (should be current week = 74086.95)`);
    console.log(`Fix working: ${lastH !== prevH ? 'YES - last bar shows developing HTF values' : 'NO - still showing previous week'}`);
}

main().catch(console.error);
