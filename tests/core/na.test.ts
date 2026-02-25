import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '../../src/marketData/Provider.class';

describe('na (dual-use identifier)', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-02-01').getTime());

    it('bare na returns NaN', async () => {
        const { result } = await pineTS.run(($) => {
            const { na } = $.pine;
            let val = na;
            return { val };
        });

        expect(result.val[0]).toBeNaN();
    });

    it('na() checks if value is NaN — true case', async () => {
        const { result } = await pineTS.run(($) => {
            const { na } = $.pine;
            let val = na;
            let check = na(val);
            return { check };
        });

        expect(result.check[0]).toBe(true);
    });

    it('na() checks if value is NaN — false case', async () => {
        const { result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { na } = $.pine;
            let check = na(close);
            return { check };
        });

        expect(result.check[0]).toBe(false);
    });

    it('na as function argument to nz()', async () => {
        const { result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { na, nz } = $.pine;
            let val = nz(close, na);
            return { val };
        });

        // close is a valid number, so nz returns close (not NaN)
        expect(result.val[0]).not.toBeNaN();
    });

    it('na in conditional expression', async () => {
        const { result } = await pineTS.run(($) => {
            const { close } = $.data;
            const { na } = $.pine;
            let val = close > 0 ? na : close;
            return { val };
        });

        // close > 0 is true, so val = na = NaN
        expect(result.val[0]).toBeNaN();
    });

    it('na works with Pine Script syntax', async () => {
        const code = `
//@version=5
indicator("NA Test")
val = na
check = na(close)
plot(check ? 1 : 0, "check")
`;
        const { plots } = await pineTS.run(code);
        expect(plots['check']).toBeDefined();
        // close is a valid number, so na(close) = false, plot = 0
        expect(plots['check'].data[0].value).toBe(0);
    });
});
