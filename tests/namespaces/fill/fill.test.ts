import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('FILL Namespace', () => {
    it('fill() between two plots creates a fill entry', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Upper');
            var p2 = plot(open, 'Lower');
            fill(p1, p2, color.new(color.blue, 80));
            return {};
        });

        // Both plots should exist
        expect(plots['Upper']).toBeDefined();
        expect(plots['Lower']).toBeDefined();

        // Find the fill entry
        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();
        expect(fillEntry.options.style).toBe('fill');
    });

    it('fill() references correct plot keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'High');
            var p2 = plot(open, 'Low');
            fill(p1, p2, color.new(color.green, 80));
            return {};
        });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should reference the correct plot keys
        expect(fillEntry.plot1).toBe('High');
        expect(fillEntry.plot2).toBe('Low');

        // plot1/plot2 should also be in options (for QFChart FillRenderer)
        expect(fillEntry.options.plot1).toBe('High');
        expect(fillEntry.options.plot2).toBe('Low');
    });

    it('fill() between two hlines references correct plot keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var h1 = hline(70, 'Overbought');
            var h2 = hline(30, 'Oversold');
            fill(h1, h2, color.new(color.green, 90));
            return {};
        });

        // Both hlines should exist as plots
        expect(plots['Overbought']).toBeDefined();
        expect(plots['Oversold']).toBeDefined();

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();
        expect(fillEntry.plot1).toBe('Overbought');
        expect(fillEntry.plot2).toBe('Oversold');
    });

    it('fill() stores plot references in both top-level and options', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Alpha');
            var p2 = plot(open, 'Beta');
            fill(p1, p2, color.blue);
            return {};
        });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Top-level references (for PineTS tests)
        expect(fillEntry.plot1).toBe('Alpha');
        expect(fillEntry.plot2).toBe('Beta');

        // options-level references (for QFChart FillRenderer which reads plotOptions)
        expect(fillEntry.options.plot1).toBe('Alpha');
        expect(fillEntry.options.plot2).toBe('Beta');
    });

    it('fill() with duplicate plot titles references correct unique keys', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Band');
            var p2 = plot(open, 'Band'); // Same title
            fill(p1, p2, color.new(color.red, 80));
            return {};
        });

        // First plot uses "Band", second gets "Band#1"
        expect(plots['Band']).toBeDefined();
        expect(plots['Band#1']).toBeDefined();

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should reference both plots by their actual keys
        expect(fillEntry.plot1).toBeDefined();
        expect(fillEntry.plot2).toBeDefined();
        expect(fillEntry.plot1).not.toBe(fillEntry.plot2);

        // Both referenced plots should exist in plots
        expect(plots[fillEntry.plot1]).toBeDefined();
        expect(plots[fillEntry.plot2]).toBeDefined();
    });

    it('multiple fill() calls create separate fill entries', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Line1');
            var p2 = plot(open, 'Line2');
            var p3 = plot(high, 'Line3');
            fill(p1, p2, color.blue);
            fill(p2, p3, color.red);
            return {};
        });

        // Find all fill entries
        const fillEntries = Object.values(plots).filter((p: any) => p.options?.style === 'fill');
        expect(fillEntries.length).toBe(2);

        // Each fill should reference different plot pairs
        const fill1 = fillEntries[0] as any;
        const fill2 = fillEntries[1] as any;
        expect(fill1.plot1).not.toBe(fill2.plot1);
    });

    it('fill() color is stored in options', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Top');
            var p2 = plot(open, 'Bottom');
            fill(p1, p2, '#ff000080');
            return {};
        });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();
        expect(fillEntry.options.color).toBe('#ff000080');
    });

    it('fill() always stores per-bar color data for dynamic colors', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Upper');
            var p2 = plot(open, 'Lower');
            // Dynamic color: flips green/red based on close > open
            fill(p1, p2, close > open ? color.green : color.red);
            return {};
        });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Fill should have per-bar data with color in options
        expect(fillEntry.data).toBeDefined();
        expect(fillEntry.data.length).toBeGreaterThan(0);

        // Each data entry should have an options.color
        for (const d of fillEntry.data) {
            expect(d.options).toBeDefined();
            expect(d.options.color).toBeDefined();
            expect(typeof d.options.color).toBe('string');
        }

        // Should contain both green and red entries (since some bars are bullish, some bearish)
        const uniqueColors = new Set(fillEntry.data.map((d: any) => d.options.color));
        expect(uniqueColors.size).toBeGreaterThanOrEqual(1);
    });

    it('fill() with static color still stores per-bar data', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'Top');
            var p2 = plot(open, 'Bottom');
            fill(p1, p2, color.new(color.blue, 80));
            return {};
        });

        const fillEntry = Object.values(plots).find((p: any) => p.options?.style === 'fill') as any;
        expect(fillEntry).toBeDefined();

        // Even static colors should have per-bar data (always pushed now)
        expect(fillEntry.data).toBeDefined();
        expect(fillEntry.data.length).toBeGreaterThan(0);

        // All entries should have the same color
        const colors = fillEntry.data.map((d: any) => d.options.color);
        const uniqueColors = new Set(colors);
        expect(uniqueColors.size).toBe(1);
    });

    it('fill() with title uses title-based key', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-01-01').getTime(), new Date('2025-01-10').getTime());

        const { plots } = await pineTS.run((context) => {
            var p1 = plot(close, 'A');
            var p2 = plot(open, 'B');
            fill(p1, p2, color.blue, 'MyFill');
            return {};
        });

        // fill should be stored with its title
        expect(plots['MyFill']).toBeDefined();
        expect(plots['MyFill'].options.style).toBe('fill');
        expect(plots['MyFill'].title).toBe('MyFill');
    });
});
