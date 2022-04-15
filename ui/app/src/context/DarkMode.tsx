// Copyright 2021 The Perses Authors
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
import { getDarkTheme, getLightTheme } from '../styles';
import { useLocalStorage } from '../utils/browser-storage';

const DARK_MODE_PREFERENCE_KEY = 'PERSES_ENABLE_DARK_MODE';

interface DarkModeContext {
  isDarkModeEnabled: boolean;
  setDarkMode: (pref: boolean) => Promise<void>;
}

export const DarkModeContext = createContext<DarkModeContext>({
  isDarkModeEnabled: false,
  setDarkMode: () => {
    throw new Error('Error: Dark mode not implemented');
  },
});

/**
 * Acts as theme provider for MUI and allows switching to dark mode.
 */
export function DarkModeContextProvider(props: { children: React.ReactNode }) {
  const browserPrefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const [isDarkModeEnabled] = useLocalStorage<boolean>(DARK_MODE_PREFERENCE_KEY, browserPrefersDarkMode);

  // store the dark mode preference in local storage
  const darkModeContext: DarkModeContext = useMemo(
    () => ({
      isDarkModeEnabled,
      setDarkMode: async (preference: boolean) => {
        window.localStorage.setItem(DARK_MODE_PREFERENCE_KEY, preference.toString());
        location.reload();
      },
    }),
    [isDarkModeEnabled]
  );

  return (
    <ThemeProvider theme={isDarkModeEnabled ? getDarkTheme() : getLightTheme()}>
      <CssBaseline />

      <DarkModeContext.Provider value={darkModeContext}>{props.children}</DarkModeContext.Provider>
    </ThemeProvider>
  );
}

export function useDarkMode(): DarkModeContext {
  const darkModeContext = useContext(DarkModeContext);
  return darkModeContext;
}
