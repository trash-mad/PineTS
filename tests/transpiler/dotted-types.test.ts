// SPDX-License-Identifier: AGPL-3.0-only

import { describe, it, expect } from 'vitest';
import { pineToJS } from '../../src/transpiler/pineToJS/pineToJS.index';
import { transpile } from '../../src/transpiler/index';

describe('Dotted Type Annotations (e.g., chart.point)', () => {
    it('should parse dotted array type declaration: chart.point[] name = ...', () => {
        const code = `
//@version=5
indicator("Test")
chart.point[] polyPoints = array.new<chart.point>()
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
        expect(result.code).toContain('polyPoints');
        expect(result.code).toContain('array.new');
    });

    it('should parse var with dotted array type: var chart.point[] name = ...', () => {
        const code = `
//@version=5
indicator("Test")
var chart.point[] pts = array.new<chart.point>()
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
        expect(result.code).toContain('pts');
    });

    it('should parse varip with dotted array type: varip chart.point[] name = ...', () => {
        const code = `
//@version=5
indicator("Test")
varip chart.point[] pts = array.new<chart.point>()
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
        expect(result.code).toContain('pts');
    });

    it('should parse simple dotted type declaration: chart.point name = ...', () => {
        const code = `
//@version=5
indicator("Test")
chart.point p = chart.point.new(0, 0.0)
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
        expect(result.code).toContain('chart.point.new');
    });

    it('should parse var with simple dotted type: var chart.point name = ...', () => {
        const code = `
//@version=5
indicator("Test")
var chart.point p = chart.point.new(0, 0.0)
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
    });

    it('should parse generic type with dotted type parameter: array<chart.point>', () => {
        const code = `
//@version=5
indicator("Test")
array<chart.point> pts = array.new<chart.point>()
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
    });

    it('should parse var with generic dotted type parameter: var array<chart.point>', () => {
        const code = `
//@version=5
indicator("Test")
var array<chart.point> pts = array.new<chart.point>()
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
    });

    it('should parse dotted types inside map generics: map<string, chart.point>', () => {
        const code = `
//@version=5
indicator("Test")
map<string, chart.point> pointMap = map.new<string, chart.point>()
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
    });

    it('should parse line.style dotted type', () => {
        const code = `
//@version=5
indicator("Test")
x = line.new(bar_index, close, bar_index, close, style=line.style_dashed)
        `;

        const result = pineToJS(code);
        expect(result.success).toBe(true);
        expect(result.code).toBeDefined();
        expect(result.code).toContain('line.style_dashed');
    });

    it('should transpile dotted array type through full pipeline', () => {
        const code = `
//@version=5
indicator("Test")
chart.point[] polyPoints = array.new<chart.point>()
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toBeDefined();
        expect(jsCode).toContain('polyPoints');
    });
});
