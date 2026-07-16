// Copyright The Perses Authors
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

import { ReactElement, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DarkModeContextProvider, useDarkMode } from './DarkMode';

let mockStoredDarkMode: boolean | null = null;
let mockServerTheme: 'light' | 'dark' | undefined;
let mockBrowserPrefersDarkMode = false;

jest.mock('@mui/material', () => ({
  CssBaseline: (): null => null,
  ThemeProvider: (props: { children: ReactNode }): ReactNode => props.children,
  useMediaQuery: (): boolean => mockBrowserPrefersDarkMode,
}));

jest.mock('@perses-dev/components', () => ({
  ChartsProvider: (props: { children: ReactNode }): ReactNode => props.children,
  generateChartsTheme: (): Record<string, never> => ({}),
  getTheme: (): Record<string, never> => ({}),
  useLocalStorage: (): [boolean | null, jest.Mock] => [mockStoredDarkMode, jest.fn()],
}));

jest.mock('@perses-dev/dashboards', () => ({
  TOGGLE_THEME_EVENT: 'toggle-theme',
}));

jest.mock('./Config', () => ({
  useConfigContext: (): object => ({
    config: { frontend: { default_user_preferences: { theme: mockServerTheme } } },
  }),
}));

function DarkModeConsumer(): ReactElement {
  const { isDarkModeEnabled } = useDarkMode();
  return <span>{isDarkModeEnabled ? 'dark' : 'light'}</span>;
}

describe('DarkModeContextProvider', () => {
  beforeEach(() => {
    mockStoredDarkMode = null;
    mockServerTheme = undefined;
    mockBrowserPrefersDarkMode = false;
  });

  it('uses the server default when no user preference is stored', () => {
    mockServerTheme = 'dark';
    render(
      <DarkModeContextProvider>
        <DarkModeConsumer />
      </DarkModeContextProvider>
    );

    expect(screen.getByText('dark')).toBeInTheDocument();
  });

  it('gives a stored user preference precedence over the server default', () => {
    mockServerTheme = 'dark';
    mockStoredDarkMode = false;
    render(
      <DarkModeContextProvider>
        <DarkModeConsumer />
      </DarkModeContextProvider>
    );

    expect(screen.getByText('light')).toBeInTheDocument();
  });

  it('uses the browser preference when neither user nor server preferences exist', () => {
    mockBrowserPrefersDarkMode = true;
    render(
      <DarkModeContextProvider>
        <DarkModeConsumer />
      </DarkModeContextProvider>
    );

    expect(screen.getByText('dark')).toBeInTheDocument();
  });
});
