// Copyright 2023 The Perses Authors
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

import { getAutoPaletteColor, getCategoricalPaletteColor, getConsistentSeriesNameColor } from './palette-gen';

describe('getCategoricalPaletteColor', () => {
  const fallbackColor = '#ff0000';

  it('should return 1st color in Categorical palette', () => {
    const paletteColor = getCategoricalPaletteColor(['#fff', '000', '#111', '#222', '#333'], 0, fallbackColor);
    expect(paletteColor).toEqual('#fff');
  });

  it('should return 3rd color in Categorical palette', () => {
    const paletteColor = getCategoricalPaletteColor(['#fff', '000', '#111', '#222', '#333'], 2, fallbackColor);
    expect(paletteColor).toEqual('#111');
  });

  it('should repeat color after looping through entire palette', () => {
    const paletteColor = getCategoricalPaletteColor(['#fff', '000', '#111', '#222', '#333'], 5, fallbackColor);
    expect(paletteColor).toEqual('#fff');
  });
});

describe('getAutoPaletteColor', () => {
  const fallbackColor = '#ff0000';

  it('should Auto palette generated color', () => {
    const generatedColor = getAutoPaletteColor('Incoming Writes per second', fallbackColor);
    expect(generatedColor).toEqual('hsla(253.45254470426408,65%,65%,0.8)');
  });
});

describe('getConsistentSeriesNameColor', () => {
  it('should generate a consistent custom hsla color', () => {
    const color = getConsistentSeriesNameColor('test');
    const colorAlt = getConsistentSeriesNameColor('test');
    expect(color).toEqual('hsla(285.9972489683631,35%,50%,0.8)');
    expect(colorAlt).toEqual('hsla(285.9972489683631,35%,50%,0.8)');
  });

  it('should generate a color from the given series name', () => {
    const generatedColor = getConsistentSeriesNameColor(
      'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}'
    );
    expect(generatedColor).toEqual('hsla(163.32874828060523,50%,35%,0.8)');
  });
});
