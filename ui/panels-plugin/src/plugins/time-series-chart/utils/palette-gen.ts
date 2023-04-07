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
  contrastPaletteColorIdx: number;
  contrastPalette: string[];
}

/*
 * Color conversion from string using predefined palette for contrast
 * String to color approach from: https://stackoverflow.com/a/31037383/17575201
 * Contrast colors started from: https://stackoverflow.com/a/12224359/17575201
 */
export const stringToColor = (() => {
  const instance: StringToColorInstance = {
    stringToColorHash: {},
    contrastPaletteColorIdx: 0,
    contrastPalette: [
      '#8DD3C7', // Turquoise
      '#01FFFE', // Cyan
      '#FFA6FE', // Pink
      '#006401', // Dark Green
      '#010067', // Dark Blue
      '#95003A', // Dark Red
      '#007DB5', // Azure
      '#FF00F6', // Magenta
      '#774D00', // Dark Brown
      '#90FB92', // Light Green
      '#0076FF', // Azure Blue
      '#FF937E', // Light Salmon
      '#6A826C', // Khaki
      '#FF029D', // Magenta
      '#FE8900', // Dark Orange
      '#7A4782', // Dark Purple
      '#7E2DD2', // Purple
      '#85A900', // Olive
      '#FF0056', // Red
      '#A42400', // Burnt Umber
      '#00AE7E', // Green
      '#683D3B', // Reddish Brown
      '#BDC6FF', // Light Blue
      '#263400', // Dark Olive Green
      '#BDD393', // Light Greenish Gray
      '#9E008E', // Deep Magenta
      '#001544', // Dark Blue (Navy)
      '#C28C9F', // Pale Pinkish Grey
      '#FF74A3', // Light Pink
      '#01D0FF', // Bright Cyan
      '#004754', // Very Dark Blue
      '#E56FFE', // Pinkish Purple
      '#788231', // Olive Drab
      '#0E4CA1', // Indigo
      '#91D0CB', // Light Bluish Green
      '#BE9970', // Tan
      '#968AE8', // Light Lavender
      '#BB8800', // Goldenrod
      '#43002C', // Dark Raspberry
    ],
  };

  return {
    next: (str: string) => {
      if (!instance.stringToColorHash[str]) {
        instance.stringToColorHash[str] = instance.contrastPalette[instance.contrastPaletteColorIdx++];
      }
      return instance.stringToColorHash[str];
    },
  };
})();
