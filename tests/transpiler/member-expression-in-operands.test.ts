import { describe, it, expect } from 'vitest';
import { PineTS, Provider } from 'index';

describe('Member Expression in Function Operands', () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2018-12-10').getTime(), new Date('2019-06-01').getTime());

    it('UDT field access in binary expression inside function call', async () => {
        // Tests that obj.field inside close - obj.field inside math.sign()
        // correctly unwraps the Series to get the current bar value
        const code = `
//@version=5
indicator("UDT Field in Binary Expr")

type mytype
    float output = 0

var obj = mytype.new()
obj.output := close

// obj.output should be properly unwrapped in binary expression inside call
diff = math.sign(close - obj.output)
plot(diff, "diff")
plot(obj.output, "output")
`;
        const { plots } = await pineTS.run(code);

        // close - obj.output should be 0 (same value), sign(0) = 0
        const diffData = plots['diff'].data;
        for (let i = 0; i < diffData.length; i++) {
            if (diffData[i].value !== null && !isNaN(diffData[i].value)) {
                expect(diffData[i].value).toBe(0);
            }
        }

        // obj.output should equal close on each bar
        const outputData = plots['output'].data;
        expect(outputData[0].value).not.toBeNaN();
    });

    it('UDT field access in nested call arguments', async () => {
        // Tests: nz(math.sign(close[1] - obj.output))
        // Both close[1] and obj.output must be properly resolved
        const code = `
//@version=5
indicator("UDT Field in Nested Call")

type mytype
    float output = 0

var obj = mytype.new()
obj.output := close[1]

// nz(math.sign(close[1] - obj.output)) should produce 0 when close[1] == obj.output
diff = nz(math.sign(close[1] - obj.output))
plot(diff, "diff")
`;
        const { plots } = await pineTS.run(code);

        const diffData = plots['diff'].data;
        // After the first bar, diff should be 0 because close[1] == obj.output
        for (let i = 2; i < diffData.length; i++) {
            if (diffData[i].value !== null) {
                expect(diffData[i].value).toBe(0);
            }
        }
    });

    it('history access in conditional expression plot argument', async () => {
        // Tests: plot(val, title, os != os[1] ? na : color)
        // os[1] inside a conditional inside a plot() argument must use $.get(var, 1)
        const code = `
//@version=5
indicator("History in Conditional Arg", overlay=true)

var os = 0
os := close > close[1] ? 1 : 0

// The color argument uses os[1] in a conditional — must be properly transpiled
css = os == 1 ? color.green : color.red
plot(close, "price", os != os[1] ? na : css)
`;
        const { plots } = await pineTS.run(code);

        const priceData = plots['price'].data;
        // Should have some non-null color entries (when os == os[1], i.e. no trend change)
        const withColor = priceData.filter(d => d.options && d.options.color != null);
        expect(withColor.length).toBeGreaterThan(0);

        // Colors should be green (#089981) or red (#F23645)
        const colors = [...new Set(withColor.map(d => d.options.color))];
        expect(colors.length).toBeGreaterThanOrEqual(1);
    });

    it('UDT field in arithmetic accumulation', async () => {
        // Tests that obj.perf can be read and updated in arithmetic operations
        // perf += 2/(alpha+1) * (value * diff - perf)
        const code = `
//@version=5
indicator("UDT Field Accumulation")

type tracker
    float perf = 0
    float output = 0

var t = tracker.new()
t.output := close
diff = nz(math.sign(close[1] - t.output))
t.perf += 0.2 * (nz(close - close[1]) * diff - t.perf)

plot(t.perf, "perf")
`;
        const { plots } = await pineTS.run(code);

        const perfData = plots['perf'].data;
        // perf should be a finite number (not NaN) after the first few bars
        let hasFiniteValue = false;
        for (let i = 2; i < perfData.length; i++) {
            if (perfData[i].value !== null && isFinite(perfData[i].value)) {
                hasFiniteValue = true;
                break;
            }
        }
        expect(hasFiniteValue).toBe(true);
    });

    it('complex index expression in bracket access (BinaryExpression)', async () => {
        // Tests that close[strideInput * 2] correctly transforms the BinaryExpression index
        // so identifiers inside the index get properly scoped ($.get($.let.glb1_strideInput, 0) * 2)
        const code = `
//@version=5
indicator("Complex Bracket Index")

int strideInput = 1
float rsiLong = ta.rsi(close[strideInput * 2], 3)

plot(rsiLong, "rsi")
`;
        const { plots } = await pineTS.run(code);

        const rsiData = plots['rsi'].data;
        // RSI should produce valid values (not NaN/crash) after warmup period
        let hasValidValue = false;
        for (let i = 5; i < rsiData.length; i++) {
            if (rsiData[i].value !== null && isFinite(rsiData[i].value)) {
                hasValidValue = true;
                break;
            }
        }
        expect(hasValidValue).toBe(true);
    });

    it('complex index expression in user function (BinaryExpression)', async () => {
        // Tests that src[stride * 3] inside a user function correctly transforms
        // the function parameter `stride` inside the BinaryExpression index
        const code = `
//@version=5
indicator("Complex Bracket in Function")

myFunc(src, stride) =>
    ta.sma(src[stride * 3], 5)

int strideInput = 1
float test3 = myFunc(close, strideInput)

plot(test3, "sma")
`;
        const { plots } = await pineTS.run(code);

        const smaData = plots['sma'].data;
        // SMA should produce valid values after warmup
        let hasValidValue = false;
        for (let i = 10; i < smaData.length; i++) {
            if (smaData[i].value !== null && isFinite(smaData[i].value)) {
                hasValidValue = true;
                break;
            }
        }
        expect(hasValidValue).toBe(true);
    });

    it('complex index in standalone bracket access (BinaryExpression via transformArrayIndex)', async () => {
        // Tests that close[strideInput * 2] in a standalone assignment (not inside a namespace call)
        // correctly transforms via transformArrayIndex — identifiers in the BinaryExpression index
        // must be scoped ($.get($.let.glb1_strideInput, 0) * 2)
        const code = `
//@version=5
indicator("Standalone Complex Bracket Index")

int strideInput = 1

// Standalone bracket with BinaryExpression index (goes through transformArrayIndex, not transformFunctionArgument)
float test1 = close[strideInput * 2]
float test2 = close[strideInput + 1]

plot(test1, "lookback_mul")
plot(test2, "lookback_add")
`;
        const { plots } = await pineTS.run(code);

        const data1 = plots['lookback_mul'].data;
        const data2 = plots['lookback_add'].data;
        // Should produce valid values (not crash with "strideInput is not defined")
        let hasValid1 = false;
        let hasValid2 = false;
        for (let i = 5; i < data1.length; i++) {
            if (data1[i].value !== null && isFinite(data1[i].value)) hasValid1 = true;
            if (data2[i].value !== null && isFinite(data2[i].value)) hasValid2 = true;
            if (hasValid1 && hasValid2) break;
        }
        expect(hasValid1).toBe(true);
        expect(hasValid2).toBe(true);
    });

    it('loop variable UDT field access in call arguments', async () => {
        // Tests that element.field inside a for-in loop works correctly
        // inside function call arguments
        const code = `
//@version=5
indicator("Loop Var UDT Field")

type item
    float value = 0

var items = array.new<item>(0)
if barstate.isfirst
    items.push(item.new(10.0))
    items.push(item.new(20.0))
    items.push(item.new(30.0))

total = 0.0
for element in items
    total += math.max(element.value, 0)

plot(total, "total")
`;
        const { plots } = await pineTS.run(code);

        // total should be 10 + 20 + 30 = 60
        expect(plots['total'].data[0].value).toBe(60);
    });
});
