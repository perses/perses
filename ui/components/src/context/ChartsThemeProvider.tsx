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

import { createContext, useContext } from 'react';
import { useTheme } from '@mui/material';

import { registerTheme } from 'echarts';
import { generateChartsTheme, EChartsTheme, PersesChartsTheme } from '../model';

export interface ChartsThemeProviderProps {
  children?: React.ReactNode;
  themeName?: string;
  theme?: EChartsTheme;
}

export function ChartsThemeProvider(props: ChartsThemeProviderProps) {
  const { children, themeName, theme } = props;
  const muiTheme = useTheme();
  const persesChartsTheme = generateChartsTheme(theme ?? {}, muiTheme);

  if (themeName !== undefined) {
    // https://apache.github.io/echarts-handbook/en/concepts/style/#theme
    registerTheme(themeName, persesChartsTheme);
  }

  const themeContext = {
    themeName,
    theme: persesChartsTheme,
  };
  return <ChartsThemeContext.Provider value={themeContext}>{children}</ChartsThemeContext.Provider>;
}

export const ChartsThemeContext = createContext<PersesChartsTheme | undefined>(undefined);

export function useChartsTheme(): PersesChartsTheme {
  const ctx = useContext(ChartsThemeContext);
  if (ctx === undefined) {
    throw new Error('No ChartsThemeContext found. Did you forget a Provider?');
  }
  return ctx;
}
