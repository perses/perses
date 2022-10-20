// Copyright 2022 The Perses Authors
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

import { PaletteMode, PaletteOptions } from '@mui/material';
import { background } from './background';
import { greyOption } from './grey';

/**
 * Returns the MUI PaletteOptions for the given mode.
 */
export function getPaletteOptions(mode: PaletteMode): PaletteOptions {
  // Palette options should be split out into their own files with functions
  // for creating the option values based on light/dark mode
  return {
    mode,
    common: {
      white: '#FFFFFF',
      black: '#000000',
    },
    grey: greyOption(mode),
    background: background(mode),
  };
}
