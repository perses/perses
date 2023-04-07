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
export function generateColorFromString(identifier: string): string {
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
  seriesIndex: number,
  palette: string[],
  fallbackColor: string,
  paletteKind: PaletteOptions['kind'] = 'Auto'
): string {
  if (paletteKind === 'Categorical' && Array.isArray(palette)) {
    const colorIndex = seriesIndex % palette.length;
    const seriesColor = palette[colorIndex];
    if (seriesColor !== undefined) {
      return seriesColor;
    }
  }
  // corresponds to 'Auto' in palette.kind
  const generatedColor = getSeriesNameColor(name);
  // fallback color comes from echarts theme
  return generatedColor ?? fallbackColor;
}

/*
 * Color conversion from string using predefined palette for contrast
 * String to color approach from: https://stackoverflow.com/a/31037383/17575201
 * Contrast colors started from: https://stackoverflow.com/a/12224359/17575201
 */
export const getSeriesNameColor = (() => {
  const stringToColorHash: Record<string, string> = {};
  return (inputString: string) => {
    // check whether color has already been generated for a given series name
    if (!stringToColorHash[inputString]) {
      // deterministic shuffle of series name so generated color is distinct
      const adjustedSeriesName = modifyString(inputString);
      stringToColorHash[inputString] = generateColorFromString(adjustedSeriesName);
    }
    return stringToColorHash[inputString];
  };
})();

// Prime number shuffles the string more evenly, changing this multiplier adjusts the overall colors that are generated
// For example, a multiplier of 17 results in more purple colors, 11 looks nice but series names that start with 'n'
// looked too similar, 7 seems to provide just enough randomness while still having colors with enough contrast
const INDEX_MULTIPLIER = 7;

/*
 * Deterministic way to slightly modify the string that is used to generate colors.
 * This allows series names that are very similar to produce distinct colors.
 */
export function modifyString(str: string): string {
  const modifiedArr = new Array(str.length);
  for (let i = 0; i < str.length; i++) {
    const newIndex = (i * INDEX_MULTIPLIER) % str.length;
    modifiedArr[newIndex] = str[i];
  }
  return modifiedArr.join('');
}
