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

import ColorHash from 'color-hash';
import { TimeSeriesChartVisualOptions } from '../time-series-chart-model';

export interface SeriesColorProps {
  categoricalPalette: string[];
  visual: TimeSeriesChartVisualOptions;
  muiPrimaryColor: string;
  seriesName: string;
  seriesIndex: number;
  totalSeries: number;
}

/**
 * Get line color as well as color for tooltip and legend, account for whether palette is 'Cateogrical' or 'Auto' (generative)
 */
export function getSeriesColor(props: SeriesColorProps) {
  const { categoricalPalette, visual, muiPrimaryColor, seriesName, seriesIndex, totalSeries } = props;
  // Fallback is unlikely to set unless echarts theme palette in charts theme provider is undefined.
  const fallbackColor =
    Array.isArray(categoricalPalette) && categoricalPalette[0]
      ? (categoricalPalette[0] as string) // Needed since echarts color property isn't always an array.
      : muiPrimaryColor;

  // Explicit way to opt-in to generative palette with consistent colors for same series names.
  if (visual.palette?.kind === 'Auto') {
    return getAutoPaletteColor(seriesName, fallbackColor);
  }

  // Explicit way to always cycle through classical palette instead of changing when based on number of series.
  if (visual.palette?.kind === 'Categorical') {
    return getCategoricalPaletteColor(categoricalPalette, seriesIndex, fallbackColor);
  }

  // Decide which palette to use based on total series returned.
  // When series number exceeds number of colors in palette, use generative colors instead.
  const paletteLength = Array.isArray(categoricalPalette) ? categoricalPalette.length : 0;
  const seriesColor =
    totalSeries <= paletteLength
      ? getCategoricalPaletteColor(categoricalPalette, seriesIndex, fallbackColor)
      : getAutoPaletteColor(seriesName, fallbackColor);
  return seriesColor;
}

/**
 * Get color from generative color palette, this approaches uses series name as the seed and
 * allows for consistent colors across panels (when all panels use this approach).
 */
export function getAutoPaletteColor(name: string, fallbackColor: string): string {
  // corresponds to 'Auto' in palette.kind for generative color palette
  const generatedColor = getConsistentSeriesNameColor(name);
  return generatedColor ?? fallbackColor;
}

/**
 * Default classical qualitative palette that cycles through the colors array by index.
 */
export function getCategoricalPaletteColor(palette: string[], seriesIndex: number, fallbackColor: string): string {
  if (palette === undefined) {
    return fallbackColor;
  }
  // Loop through predefined static color palette
  const paletteTotalColors = palette.length ?? 1;
  const paletteIndex = seriesIndex % paletteTotalColors;
  // fallback color comes from echarts theme
  const seriesColor = palette[paletteIndex] ?? fallbackColor;
  return seriesColor;
}

// Valid hue values are 0 to 360 and can be adjusted to control the generated colors.
// More info: https://github.com/zenozeng/color-hash#custom-hue
// Picked min of 20 and max of 360 to exclude common threshold colors (red).
// Series names with "error" in them will always be generated as red.
const ERROR_HUE_CUTOFF = 20;
const colorGenerator = new ColorHash({ hue: { min: ERROR_HUE_CUTOFF, max: 360 } });
const redColorGenerator = new ColorHash({ hue: { min: 0, max: ERROR_HUE_CUTOFF } });

// To check whether a color has already been generated for a given string.
// TODO: Predefined color aliases will be defined here
const seriesNameToColorLookup: Record<string, string> = {};

/*
 * Check whether a color was already generated for a given series name and if not,
 * generate a new color (if series name includes 'error', it will have a red hue).
 */
export const getConsistentSeriesNameColor = (() => {
  return (inputString: string) => {
    // Check whether color has already been generated for a given series name.
    // Ensures colors are consistent across panels.
    if (!seriesNameToColorLookup[inputString]) {
      const seriesNameContainsError = inputString.toLowerCase().includes('error');
      const [hue, saturation, lightness] = seriesNameContainsError
        ? redColorGenerator.hsl(inputString)
        : colorGenerator.hsl(inputString);
      const saturationPercent = `${(saturation * 100).toFixed(0)}%`;
      const lightnessPercent = `${(lightness * 100).toFixed(0)}%`;
      const colorString = `hsla(${hue.toFixed(2)},${saturationPercent},${lightnessPercent},0.9)`;
      seriesNameToColorLookup[inputString] = colorString;
    }
    return seriesNameToColorLookup[inputString];
  };
})();
