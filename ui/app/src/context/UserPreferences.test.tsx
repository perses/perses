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
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserPreferences } from '../model/userPreferences';
import { UserPreferencesContextProvider, useUserPreferences } from './UserPreferences';

const mockSetLocalStorage = jest.fn();

jest.mock('@perses-dev/components', () => ({
  useLocalStorage: (key: string, defaultValue: unknown): [unknown, jest.Mock] => {
    const storedValue = window.localStorage.getItem(key);
    return [storedValue === null ? defaultValue : JSON.parse(storedValue), mockSetLocalStorage];
  },
}));

function PreferencesConsumer(): ReactElement {
  const { userPreferences, updateUserPreferences } = useUserPreferences();
  return (
    <>
      <span data-testid="timezone">{userPreferences.timezone}</span>
      <button onClick={() => updateUserPreferences({ timezone: 'Europe/Berlin' })}>Save timezone</button>
    </>
  );
}

describe('UserPreferencesContextProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockSetLocalStorage.mockClear();
  });

  it('returns empty preferences when no provider exists', () => {
    render(<PreferencesConsumer />);

    expect(screen.getByTestId('timezone')).toBeEmptyDOMElement();
  });

  it('uses the server default when no user preference is stored', () => {
    render(
      <UserPreferencesContextProvider defaultPreferences={{ timezone: 'UTC' }}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>
    );

    expect(screen.getByTestId('timezone')).toHaveTextContent('UTC');
  });

  it('gives a stored user preference precedence over the server default', () => {
    window.localStorage.setItem('PERSES_USER_PREFERENCES', JSON.stringify({ timezone: 'Europe/Berlin' }));

    render(
      <UserPreferencesContextProvider defaultPreferences={{ timezone: 'UTC' }}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>
    );

    expect(screen.getByTestId('timezone')).toHaveTextContent('Europe/Berlin');
  });

  it('merges missing stored fields with server defaults', () => {
    window.localStorage.setItem('PERSES_USER_PREFERENCES', JSON.stringify({}));

    render(
      <UserPreferencesContextProvider defaultPreferences={{ timezone: 'UTC' }}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>
    );

    expect(screen.getByTestId('timezone')).toHaveTextContent('UTC');
  });

  it('updates stored preferences without persisting resolved defaults', () => {
    const defaultPreferences: UserPreferences & { futurePreference: string } = {
      timezone: 'UTC',
      futurePreference: 'server-default',
    };
    render(
      <UserPreferencesContextProvider defaultPreferences={defaultPreferences}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save timezone' }));

    expect(mockSetLocalStorage).toHaveBeenCalledWith({ timezone: 'Europe/Berlin' });
  });
});
