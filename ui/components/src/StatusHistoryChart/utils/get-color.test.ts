// Copyright 2024 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { getColorForValue, getColorsForValues, hexToHSL, hslToHex } from './get-color';

describe('getColorForValue', () => {
  it('should return a valid color for a given value and base color', () => {
    const color = getColorForValue('test', '#ff0000');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should fall back to default color for invalid base color', () => {
    const color = getColorForValue('test', 'invalid-color');
    expect(color).toBe('#588a0f');
  });

  it('should handle numeric values correctly', () => {
    const color = getColorForValue(123, '#00ff00');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should use fallback color on error', () => {
    const color = getColorForValue('test', '#zzzzzz');
    expect(color).toBe('#588a0f');
  });
});

describe('getColorsForValues', () => {
  it('should return theme colors if enough are provided', () => {
    const colors = getColorsForValues(['a', 'b'], ['#ff0000', '#00ff00']);
    expect(colors).toEqual(['#ff0000', '#00ff00']);
  });

  it('should generate additional colors if not enough theme colors are provided', () => {
    const colors = getColorsForValues(['a', 'b', 'c'], ['#ff0000']);
    expect(colors.length).toBe(3);
    expect(colors[0]).toBe('#ff0000');
    expect(colors[1]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(colors[2]).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('hexToHSL', () => {
  it('should convert hex to HSL correctly', () => {
    const [h, s, l] = hexToHSL('#ff0000');
    expect(h).toBeCloseTo(0);
    expect(s).toBeCloseTo(100);
    expect(l).toBeCloseTo(50);
  });
});

describe('hslToHex', () => {
  it('should convert HSL to hex correctly', () => {
    const hex = hslToHex(0, 100, 50);
    expect(hex).toBe('#ff0000');
  });
});
