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

import React, { createContext, ReactElement, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '@perses-dev/components';
import { UserPreferences } from '../model/userPreferences';

interface UserPreferencesContextType {
  userPreferences: UserPreferences;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
}

const USER_PREFERENCES_KEY = 'PERSES_USER_PREFERENCES';

const UserPreferencesContext = createContext<UserPreferencesContextType>({
  userPreferences: {},
  updateUserPreferences: () => undefined,
});

export function UserPreferencesContextProvider(props: {
  children: React.ReactNode;
  defaultPreferences: UserPreferences;
}): ReactElement {
  const [storedPreferences, setStoredPreferences] = useLocalStorage<UserPreferences | null>(USER_PREFERENCES_KEY, null);
  const userPreferences = useMemo(
    () => ({ ...props.defaultPreferences, ...storedPreferences }),
    [props.defaultPreferences, storedPreferences]
  );
  const updateUserPreferences = useCallback(
    (preferences: Partial<UserPreferences>): void => {
      setStoredPreferences({ ...storedPreferences, ...preferences });
    },
    [setStoredPreferences, storedPreferences]
  );
  const contextValue = useMemo(
    () => ({
      userPreferences,
      updateUserPreferences,
    }),
    [updateUserPreferences, userPreferences]
  );

  return <UserPreferencesContext.Provider value={contextValue}>{props.children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences(): UserPreferencesContextType {
  return useContext(UserPreferencesContext);
}
