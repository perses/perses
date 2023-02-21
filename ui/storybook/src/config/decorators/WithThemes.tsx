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

import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo } from 'react';
import { DecoratorFn } from '@storybook/react';
import { useDarkMode } from 'storybook-dark-mode';
import { getTheme, ChartsThemeProvider, generateChartsTheme } from '../../../../components/src';

export const WithThemes: DecoratorFn = (Story) => {
  const isDarkModeEnabled = useDarkMode();

  const theme = useMemo(() => getTheme(isDarkModeEnabled ? 'dark' : 'light'), [isDarkModeEnabled]);
  const chartsTheme = useMemo(() => {
    return generateChartsTheme(theme, {});
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChartsThemeProvider chartsTheme={chartsTheme}>
        <Story />
      </ChartsThemeProvider>
    </ThemeProvider>
  );
};
