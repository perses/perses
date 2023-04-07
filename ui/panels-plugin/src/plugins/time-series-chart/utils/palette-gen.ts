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

import { PaletteOptions } from '../time-series-chart-model';

/**
 * Helper function to generate a random color for a chart series based on its name
 */
export function getRandomColor(identifier: string): string {
  let hash = 0;
  for (let index = 0; index < identifier.length; index++) {
    hash = identifier.charCodeAt(index) + ((hash << 5) - hash);
  }
  // Use HSLA to only get random "bright" colors from this
  const color = `hsla(${~~(180 * hash)},50%,50%,0.8)`;
  return color;
}

/**
 * Get line color as well as color for tooltip and legend, account for whether palette is 'Cateogrical' or 'Auto' (generative)
 */
export function getSeriesColor(
  name: string,
  seriesCount: number,
  palette: string[],
  fallbackColor: string,
  paletteKind: PaletteOptions['kind'] = 'Auto'
): string {
  if (paletteKind === 'Categorical' && Array.isArray(palette)) {
    const colorIndex = seriesCount % palette.length;
    // TODO: take fallback color from theme
    const seriesColor = palette[colorIndex];
    if (seriesColor !== undefined) {
      return seriesColor;
    }
  }

  // corresponds to 'Auto' in palette.kind
  const generatedColor = stringToColor.next(name);
  return generatedColor ?? fallbackColor;
}

interface StringToColorInstance {
  stringToColorHash: Record<string, string | undefined>;
  nextVeryDifferentColorIdx: number;
  veryDifferentColors: string[];
}

/*
 * Color conversion from string using palette for contrast
 * https://stackoverflow.com/a/31037383/17575201
 */
export const stringToColor = (() => {
  const instance: StringToColorInstance = {
    stringToColorHash: {},
    nextVeryDifferentColorIdx: 0,
    veryDifferentColors: [
      '#000000',
      '#00FF00',
      '#0000FF',
      '#FF0000',
      '#01FFFE',
      '#FFA6FE',
      '#FFDB66',
      '#006401',
      '#010067',
      '#95003A',
      '#007DB5',
      '#FF00F6',
      '#FFEEE8',
      '#774D00',
      '#90FB92',
      '#0076FF',
      '#D5FF00',
      '#FF937E',
      '#6A826C',
      '#FF029D',
      '#FE8900',
      '#7A4782',
      '#7E2DD2',
      '#85A900',
      '#FF0056',
      '#A42400',
      '#00AE7E',
      '#683D3B',
      '#BDC6FF',
      '#263400',
      '#BDD393',
      '#00B917',
      '#9E008E',
      '#001544',
      '#C28C9F',
      '#FF74A3',
      '#01D0FF',
      '#004754',
      '#E56FFE',
      '#788231',
      '#0E4CA1',
      '#91D0CB',
      '#BE9970',
      '#968AE8',
      '#BB8800',
      '#43002C',
      '#DEFF74',
      '#00FFC6',
      '#FFE502',
      '#620E00',
      '#008F9C',
      '#98FF52',
      '#7544B1',
      '#B500FF',
      '#00FF78',
      '#FF6E41',
      '#005F39',
      '#6B6882',
      '#5FAD4E',
      '#A75740',
      '#A5FFD2',
      '#FFB167',
      '#009BFF',
      '#E85EBE',
    ],
  };

  return {
    next: (str: string) => {
      if (!instance.stringToColorHash[str]) {
        instance.stringToColorHash[str] = instance.veryDifferentColors[instance.nextVeryDifferentColorIdx++];
      }
      return instance.stringToColorHash[str];
    },
  };
})();
