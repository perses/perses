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

import { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserPreferencesContextProvider, useUserPreferences } from './UserPreferences';

jest.mock('@perses-dev/components', () => ({
  useLocalStorage: (key: string, defaultValue: unknown): [unknown, jest.Mock] => {
    const storedValue = window.localStorage.getItem(key);
    return [storedValue === null ? defaultValue : JSON.parse(storedValue), jest.fn()];
  },
}));

function PreferencesConsumer(): ReactElement {
  const { userPreferences } = useUserPreferences();
  return <span>{userPreferences.timezone}</span>;
}

describe('UserPreferencesContextProvider', () => {
  beforeEach(() => window.localStorage.clear());

  it('uses the server default when no user preference is stored', () => {
    render(
      <UserPreferencesContextProvider defaultPreferences={{ timezone: 'UTC' }}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>
    );

    expect(screen.getByText('UTC')).toBeInTheDocument();
  });

  it('gives a stored user preference precedence over the server default', () => {
    window.localStorage.setItem('PERSES_USER_PREFERENCES', JSON.stringify({ timezone: 'Europe/Berlin' }));

    render(
      <UserPreferencesContextProvider defaultPreferences={{ timezone: 'UTC' }}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>
    );

    expect(screen.getByText('Europe/Berlin')).toBeInTheDocument();
  });
});
