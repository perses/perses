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

import type {} from './types/ThemeExtension';
import { PersesColor } from './palette';

export * from './theme';

//Use Typescript interface augmentation to extend the MUI type definition
declare module '@mui/material/styles/createPalette' {
  interface TypeBackground {
    navigation: string;
    tooltip: string;
    overlay: string;
    border: string;
  }

  interface TypeText {
    navigation: string;
    accent: string;
    link: string;
    linkHover: string;
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    /**
     * The base colors from Perses design system. Use sparingly since
     * this is meant as an escape hatch when the theme's other semantic colors
     * won't get you what you need.
     */
    designSystem: {
      blue: PersesColor;
      green: PersesColor;
      grey: PersesColor;
      orange: PersesColor;
      purple: PersesColor;
      red: PersesColor;
    };
  }

  interface PaletteOptions {
    designSystem?: Palette['designSystem'];
  }
}
