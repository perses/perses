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

import { getConsistentCategoricalColor, getConsistentColor } from './palette';

describe('getConsistentColor', () => {
  it('should generate a consistent custom hsla color', () => {
    const color = getConsistentColor('test', false);
    const colorAlt = getConsistentColor('test', false);
    const firstResult = 'hsla(289.38,35%,50%,0.9)';
    // ensures generated color does not change on subsequent calls with same series name
    expect(color).toEqual(firstResult);
    expect(colorAlt).toEqual(firstResult);
  });

  it('should generate a consistent custom hsla color, depending on the error state', () => {
    const color = getConsistentColor('test', false);
    const color2 = getConsistentColor('test', false);
    const colorErr = getConsistentColor('test', true);
    const colorErr2 = getConsistentColor('test', true);
    // ensures generated color does not change on subsequent calls
    expect(color).toEqual(color2);
    expect(colorErr).toEqual(colorErr2);
    // expect colors to be different
    expect(color).not.toEqual(colorErr);
  });

  it('should generate a consistent categorical color, depending on the error state', () => {
    const categoricalPalette = ['#aaa', '#aab', '#aac'];
    const errorPalette = ['#baa', '#bab', '#bac'];
    const color = getConsistentCategoricalColor('test', false, categoricalPalette, errorPalette);
    const color2 = getConsistentCategoricalColor('test', false, categoricalPalette, errorPalette);
    const colorErr = getConsistentCategoricalColor('test', true, categoricalPalette, errorPalette);
    const colorErr2 = getConsistentCategoricalColor('test', true, categoricalPalette, errorPalette);
    // ensures generated color does not change on subsequent calls
    expect(color).toEqual(color2);
    expect(colorErr).toEqual(colorErr2);
    // expect colors to be different
    expect(color).not.toEqual(colorErr);
    // hash doesn't change, so we can statically verify the expected color
    expect(color).toEqual('#aab');
    expect(colorErr).toEqual('#bab');
  });
});
