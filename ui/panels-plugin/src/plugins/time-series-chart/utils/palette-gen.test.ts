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

import { VisualOptions } from '../time-series-chart-model';
import {
  getSeriesColor,
  getAutoPaletteColor,
  getCategoricalPaletteColor,
  getConsistentSeriesNameColor,
  SeriesColorProps,
} from './palette-gen';

describe('getSeriesColor', () => {
  const fallbackColor = '#000';
  const testCategoricalPalette = [
    '#56B4E9', // lt blue
    '#009E73', // med green
    '#0072B2', // dk blue
    '#CC79A7', // lt purple
    '#F0E442', // yellow
    '#E69F00', // orange
    '#D55E00', // red
  ];
  const testSeriesName = 'Test series name';
  const testSeriesNameGeneratedColor = 'hsla(17.70,50%,50%,0.9)';

  it('should return the first color from default Categorical palette', () => {
    const props: SeriesColorProps = {
      categoricalPalette: testCategoricalPalette,
      visual: {},
      muiPrimaryColor: fallbackColor,
      seriesName: testSeriesName,
      seriesIndex: 0,
      totalSeries: 1,
    };
    const paletteColor = getSeriesColor(props);
    expect(paletteColor).toEqual(testCategoricalPalette[0]);
  });

  it('should return the last color from default Categorical palette', () => {
    const props: SeriesColorProps = {
      categoricalPalette: testCategoricalPalette,
      visual: {},
      muiPrimaryColor: fallbackColor,
      seriesName: testSeriesName,
      seriesIndex: 6,
      totalSeries: 1,
    };
    const paletteColor = getSeriesColor(props);
    expect(paletteColor).toEqual('#D55E00');
  });

  it('should return color from the generative Auto palette when all Categorical colors have been used', () => {
    const props: SeriesColorProps = {
      categoricalPalette: testCategoricalPalette,
      visual: {},
      muiPrimaryColor: fallbackColor,
      seriesName: testSeriesName,
      seriesIndex: 0,
      totalSeries: 8,
    };
    const paletteColor = getSeriesColor(props);
    expect(paletteColor).toEqual(testSeriesNameGeneratedColor);
  });

  it('should return color from the generative Auto palette when visual option is defined', () => {
    const visualOptionAuto: VisualOptions = {
      palette: {
        kind: 'Auto',
      },
    };
    const props: SeriesColorProps = {
      categoricalPalette: testCategoricalPalette,
      visual: visualOptionAuto,
      muiPrimaryColor: fallbackColor,
      seriesName: testSeriesName,
      seriesIndex: 0,
      totalSeries: 1,
    };
    const paletteColor = getSeriesColor(props);
    expect(paletteColor).toEqual(testSeriesNameGeneratedColor);
  });

  it('should return color from the Categorical palette when visual option is defined', () => {
    const visualOptionCategorical: VisualOptions = {
      palette: {
        kind: 'Categorical',
      },
    };
    const props: SeriesColorProps = {
      categoricalPalette: testCategoricalPalette,
      visual: visualOptionCategorical,
      muiPrimaryColor: fallbackColor,
      seriesName: testSeriesName,
      seriesIndex: 0,
      totalSeries: 8,
    };
    const paletteColor = getSeriesColor(props);
    expect(paletteColor).toEqual(testCategoricalPalette[0]);
  });

  it('should return Auto generated color when the Categorical palette is undefined', () => {
    const props = {
      categoricalPalette: undefined,
      visual: {},
      muiPrimaryColor: fallbackColor,
      seriesName: testSeriesName,
      seriesIndex: 0,
      totalSeries: 8,
    } as unknown as SeriesColorProps;
    const paletteColor = getSeriesColor(props);
    expect(paletteColor).toEqual(testSeriesNameGeneratedColor);
  });
});

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
  it('should auto generate a color from the series name', () => {
    const generatedColor = getAutoPaletteColor('Incoming Writes per second', fallbackColor);
    expect(generatedColor).toEqual('hsla(243.49,65%,65%,0.9)');
  });

  it('should generate a unique color from the series name', () => {
    const generatedColor = getAutoPaletteColor(
      'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
      fallbackColor
    );
    expect(generatedColor).toEqual('hsla(122.17,50%,35%,0.9)');
  });
});

describe('getConsistentSeriesNameColor', () => {
  it('should generate a consistent custom hsla color', () => {
    const color = getConsistentSeriesNameColor('test');
    const colorAlt = getConsistentSeriesNameColor('test');
    const firstResult = 'hsla(287.30,35%,50%,0.9)';
    // ensures generated color does not change on subsequent calls with same series name
    expect(color).toEqual(firstResult);
    expect(colorAlt).toEqual(firstResult);
  });
});
