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

import { DocsContainer } from './DocsContainer';
import { WithThemes, WithBackground } from './decorators';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  backgrounds: {
    // Disabling backgrounds, so we can use custom logic of our own for
    // backgrounds with our themes. It needs to be disabled because it comes
    // bundled with the storybook essentials addon.
    disable: true,
    grid: {
      disable: true,
    },
  },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  darkMode: {
    stylePreview: true,
  },
  docs: {
    container: DocsContainer,
  },
  options: {
    storySort: {
      method: 'alphabetical',
    },
  },
};

export const globalTypes = {
  backgrounds: {
    name: 'Background',
    description: 'Background color',
    defaultValue: 'paper',
    toolbar: {
      icon: 'photo',
      items: ['paper', 'default', 'overlay', 'navigation', 'tooltip'],
      // Change title based on selected value
      dynamicTitle: true,
    },
  },
};

export const decorators = [WithBackground, WithThemes];
