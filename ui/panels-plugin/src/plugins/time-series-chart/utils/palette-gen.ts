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

/**
 * Get color from generative color palette
 */
export function getAutoPaletteColor(name: string, fallbackColor: string): string {
  // corresponds to 'Auto' in palette.kind for generative color palette
  const generatedColor = getConsistentSeriesNameColor(name);
  return generatedColor ?? fallbackColor;
}

/**
 * Get line color as well as color for tooltip and legend, account for whether palette is 'Cateogrical' or 'Auto' (generative)
 */
export function getCategoricalPaletteColor(palette: string[], paletteIndex: number, fallbackColor: string): string {
  const paletteTotalColors = palette.length ?? 0;
  // Loop through predefined static color palette
  const colorIndex = paletteIndex % paletteTotalColors;
  // fallback color comes from echarts theme
  const seriesColor = palette[colorIndex] ?? fallbackColor;
  return seriesColor;
}

// Valid hue values are 0 to 360 and can be adjusted to control the generated colors.
// More info: https://github.com/zenozeng/color-hash#custom-hue
// Picked min of 30 and max of 360 to exclude common threshold colors (reddish).
// Series names with "error" in them will always be generated as red.
const ERROR_HUE_CUTOFF = 30;
const colorGenerator = new ColorHash({ hue: { min: ERROR_HUE_CUTOFF, max: 360 } });
const redColorGenerator = new ColorHash({ hue: { min: 0, max: ERROR_HUE_CUTOFF } });

// To check whether a color has already been generated for a given string.
// TODO: Predefined color aliases will be defined here
const seriesNameToColorLookup: Record<string, string> = {};

/*
 * Check whether a color was already generated for a given series name
 */
export const getConsistentSeriesNameColor = (() => {
  return (inputString: string) => {
    // Check whether color has already been generated for a given series name.
    // Ensures colors are consistent across panels
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
