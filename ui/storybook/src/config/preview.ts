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

import { isHappoRun, setThemeSwitcher } from 'happo-plugin-storybook/register';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';
import { initialize as initializeMSW, mswDecorator } from 'msw-storybook-addon';
import { DocsContainer } from './DocsContainer';
import { WithThemes, WithBackground, WithTimeZone } from './decorators';

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
  happo: {
    themes: ['light', 'dark'],
  },
  options: {
    storySort: {
      method: 'alphabetical',
    },
  },
};

// TypeScript doesn't know about `supportedValuesOf` even though it's available
// on modern browsers. Since this is just a config file, ts-ignoring as a quick
// fix.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/supportedValuesOf
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const timeZoneNames = (Intl.supportedValuesOf('timeZone') as string[]) || [];

export const globalTypes = {
  bgColor: {
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
  timeZone: {
    name: 'Time Zone',
    description: 'Time zone',

    // When running in Happo, we always use UTC for consistency in screenshots
    // regardless of the server they run on. When being used by humans, use local
    // to start because that will make more sense for viewing documentation.
    defaultValue: isHappoRun() ? 'UTC' : 'local',
    toolbar: {
      icon: 'time',
      items: ['local', 'UTC', ...timeZoneNames],
      // Change title based on selected value
      dynamicTitle: true,
    },
  },
};

// Set up happo to handle theme switching to enable automatically taking
// screenshots of both light and dark mode for components.
setThemeSwitcher(async (theme, channel) => {
  return new Promise((resolve) => {
    const isDarkMode = theme === 'dark';

    // Listen for dark mode to change and resolve.
    channel.once(DARK_MODE_EVENT_NAME, () => {
      resolve();
    });
    // Change the theme.
    channel.emit(DARK_MODE_EVENT_NAME, isDarkMode);
  });
});

initializeMSW({ onUnhandledRequest: 'bypass' });

export const decorators = [mswDecorator, WithTimeZone, WithBackground, WithThemes];
