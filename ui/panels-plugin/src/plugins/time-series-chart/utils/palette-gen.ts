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
  // Loop through predefined static color palette
  const colorIndex = paletteIndex % palette.length;
  // fallback color comes from echarts theme
  const seriesColor = palette[colorIndex] ?? fallbackColor;
  return seriesColor;
}

// Valid hue values are 0 to 360 and can be adjusted to control the generated colors.
// Picked min of 80 and max of 340 to exclude common threshold colors (orange / reddish).
// See: https://github.com/zenozeng/color-hash#custom-hue
const colorHash = new ColorHash({ hue: { min: 80, max: 340 } });
const seriesNameToColorLookup: Record<string, string> = {};

/*
 * Check whether a color was already generated for a given series name
 */
export const getConsistentSeriesNameColor = (() => {
  return (inputString: string) => {
    // Check whether color has already been generated for a given series name.
    // Ensures colors are consistent across panels
    if (!seriesNameToColorLookup[inputString]) {
      const [hue, saturation, lightness] = colorHash.hsl(inputString);
      const saturationPercent = `${(saturation * 100).toFixed(0)}%`;
      const lightnessPercent = `${(lightness * 100).toFixed(0)}%`;
      const colorString = `hsla(${hue},${saturationPercent},${lightnessPercent},0.8)`;
      seriesNameToColorLookup[inputString] = colorString;
    }
    return seriesNameToColorLookup[inputString];
  };
})();
