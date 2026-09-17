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

import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

import type { UserPreferences } from '../model/userPreferences';
import { UserPreferencesContextProvider, useUserPreferences } from './UserPreferences';

const mockSetLocalStorage = vi.fn();
const defaultPreferences: UserPreferences = { timezone: 'UTC' };
const defaultPreferencesWithFutureField: UserPreferences & { futurePreference: string } = {
  timezone: 'UTC',
  futurePreference: 'server-default',
};

vi.mock('@perses-dev/components', () => ({
  useLocalStorage: (key: string, defaultValue: unknown): [unknown, Mock] => {
    const storedValue = window.localStorage.getItem(key);
    return [storedValue === null ? defaultValue : JSON.parse(storedValue), mockSetLocalStorage];
  },
}));

function PreferencesConsumer(): ReactElement {
  const { userPreferences, updateUserPreferences } = useUserPreferences();
  const saveTimezone = useCallback(
    (): void => updateUserPreferences({ timezone: 'Europe/Berlin' }),
    [updateUserPreferences],
  );
  return (
    <>
      <output aria-label="Timezone">{userPreferences.timezone}</output>
      <button type="button" onClick={saveTimezone}>
        Save timezone
      </button>
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

    expect(screen.getByRole('status', { name: 'Timezone' }).textContent).toBe('');
  });

  it('uses the server default when no user preference is stored', () => {
    render(
      <UserPreferencesContextProvider defaultPreferences={defaultPreferences}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>,
    );

    expect(screen.getByRole('status', { name: 'Timezone' }).textContent).toBe('UTC');
  });

  it('gives a stored user preference precedence over the server default', () => {
    window.localStorage.setItem('PERSES_USER_PREFERENCES', JSON.stringify({ timezone: 'Europe/Berlin' }));

    render(
      <UserPreferencesContextProvider defaultPreferences={defaultPreferences}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>,
    );

    expect(screen.getByRole('status', { name: 'Timezone' }).textContent).toBe('Europe/Berlin');
  });

  it('merges missing stored fields with server defaults', () => {
    window.localStorage.setItem('PERSES_USER_PREFERENCES', JSON.stringify({}));

    render(
      <UserPreferencesContextProvider defaultPreferences={defaultPreferences}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>,
    );

    expect(screen.getByRole('status', { name: 'Timezone' }).textContent).toBe('UTC');
  });

  it('updates stored preferences without persisting resolved defaults', () => {
    render(
      <UserPreferencesContextProvider defaultPreferences={defaultPreferencesWithFutureField}>
        <PreferencesConsumer />
      </UserPreferencesContextProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save timezone' }));

    expect(mockSetLocalStorage).toHaveBeenCalledWith({ timezone: 'Europe/Berlin' });
  });
});
