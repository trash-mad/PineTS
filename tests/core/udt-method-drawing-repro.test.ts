import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('UDT method with drawing fields (repro)', () => {
    const makePineTS = () =>
        new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2019-01-01').getTime(), new Date('2019-03-01').getTime());

    it('method calling set_xy1 on UDT line field', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("method set_xy1 test", overlay=true)
type MyFib
    line ln1
method setLines(MyFib f, int x1, int x2, float y) =>
    f.ln1.set_xy1(x1, y)
    f.ln1.set_xy2(x2, y)
var MyFib fib = MyFib.new(
    ln1 = line.new(na, na, na, na, color=#ff0000)
)
fib.setLines(bar_index - 5, bar_index, close)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    it('linefill.get_line1().set_xy1() chain on UDT field (Elliott Wave pattern)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("linefill chain repro", overlay=true)
type fibL
    line wave1
    linefill l_fill_

var fibL nFibL = fibL.new(
    wave1 = line.new(na, na, na, na, color=#ff0000),
    l_fill_ = linefill.new(line.new(na, na, na, na), line.new(na, na, na, na), color.new(color.red, 90))
)
nFibL.l_fill_.get_line1().set_xy1(bar_index - 5, close)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });

    it('var UDT inside if block — variable accessible within if scope (nFibL pattern)', async () => {
        const pineTS = makePineTS();
        const code = `
//@version=6
indicator("var inside if", overlay=true)
type MyObj
    line ln
    bool flag = false

method setLines(MyObj obj, int x1, int x2, float y) =>
    obj.ln.set_xy1(x1, y)
    obj.ln.set_xy2(x2, y)

draw(enabled) =>
    if enabled
        var MyObj nObj = MyObj.new(
            ln = line.new(na, na, na, na, color=#ff0000)
        )
        nObj.setLines(bar_index - 5, bar_index, close)
        nObj.flag := true
        nObj.ln.set_xy1(bar_index - 3, close)

draw(true)
plot(close)
`;
        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
    });
});
