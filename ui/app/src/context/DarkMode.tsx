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

import React, { createContext, useContext, useMemo } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { ChartsThemeProvider, generateChartsTheme, PersesChartsTheme, getTheme } from '@perses-dev/components';
import { useLocalStorage } from '../utils/browser-storage';

// app specific echarts option overrides, empty since perses uses default
// https://apache.github.io/echarts-handbook/en/concepts/style/#theme
const ECHARTS_THEME_OVERRIDES = {};

const DARK_MODE_PREFERENCE_KEY = 'PERSES_ENABLE_DARK_MODE';

interface DarkModeContext {
  isDarkModeEnabled: boolean;
  setDarkMode: (pref: boolean) => void;
}

export const DarkModeContext = createContext<DarkModeContext | undefined>(undefined);

/**
 * Acts as theme provider for MUI and allows switching to dark mode.
 */
export function DarkModeContextProvider(props: { children: React.ReactNode }) {
  const browserPrefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [isDarkModeEnabled, setDarkMode] = useLocalStorage<boolean>(DARK_MODE_PREFERENCE_KEY, browserPrefersDarkMode);

  // store the dark mode preference in local storage
  const darkModeContext: DarkModeContext = useMemo(
    () => ({
      isDarkModeEnabled,
      setDarkMode,
    }),
    [isDarkModeEnabled, setDarkMode]
  );

  const theme = useMemo(() => getTheme(isDarkModeEnabled ? 'dark' : 'light'), [isDarkModeEnabled]);
  const chartsTheme: PersesChartsTheme = useMemo(() => {
    return generateChartsTheme(theme, ECHARTS_THEME_OVERRIDES);
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ChartsThemeProvider chartsTheme={chartsTheme}>
        <DarkModeContext.Provider value={darkModeContext}>{props.children}</DarkModeContext.Provider>
      </ChartsThemeProvider>
    </ThemeProvider>
  );
}

export function useDarkMode(): DarkModeContext {
  const ctx = useContext(DarkModeContext);
  if (ctx === undefined) {
    throw new Error('No DarkModeContext found. Did you forget a Provider?');
  }
  return ctx;
}
