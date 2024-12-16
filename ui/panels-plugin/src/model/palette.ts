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

import ColorHash from 'color-hash';

// Valid hue values are 0 to 360 and can be adjusted to control the generated colors.
// More info: https://github.com/zenozeng/color-hash#custom-hue
// Picked min of 20 and max of 360 to exclude common threshold colors (red).
// Items with "error" in them will always be generated as red.
const ERROR_HUE_CUTOFF = 20;
const colorGenerator = new ColorHash({ hue: { min: ERROR_HUE_CUTOFF, max: 360 } });
const redColorGenerator = new ColorHash({ hue: { min: 0, max: ERROR_HUE_CUTOFF } });

function computeConsistentColor(name: string, error: boolean): string {
  const [hue, saturation, lightness] = error ? redColorGenerator.hsl(name) : colorGenerator.hsl(name);
  const saturationPercent = `${(saturation * 100).toFixed(0)}%`;
  const lightnessPercent = `${(lightness * 100).toFixed(0)}%`;
  return `hsla(${hue.toFixed(2)},${saturationPercent},${lightnessPercent},0.9)`;
}

// To check whether a color has already been generated for a given string.
// TODO: Predefined color aliases will be defined here
const colorLookup: Record<string, string> = {};

/**
 * Return a consistent color for (name, error) tuple
 */
export function getConsistentColor(name: string, error: boolean): string {
  const key = `${name}_____${error}`;
  let value = colorLookup[key];
  if (!value) {
    value = computeConsistentColor(name, error);
    colorLookup[key] = value;
  }
  return value;
}

export function getConsistentCategoricalColor(
  name: string,
  error: boolean,
  categoricalPalette: string[],
  errorPalette: string[]
): string {
  const palette = error ? errorPalette : categoricalPalette;
  if (palette.length === 0) {
    console.warn('getConsistentCategoricalColor() called with empty color palette, fallback to #000');
    return '#000';
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length] ?? '#000';
}
