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

import React, { createContext, ReactElement, useContext, useMemo } from 'react';
import { useLocalStorage } from '@perses-dev/components';
import { UserPreferences } from '../model/userPreferences';

interface UserPreferencesContextType {
  userPreferences: UserPreferences;
  setUserPreferences: (preferences: UserPreferences) => void;
}

const USER_PREFERENCES_KEY = 'PERSES_USER_PREFERENCES';

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

export function UserPreferencesContextProvider(props: {
  children: React.ReactNode;
  defaultPreferences: UserPreferences;
}): ReactElement {
  const [storedPreferences, setUserPreferences] = useLocalStorage<UserPreferences | null>(USER_PREFERENCES_KEY, null);
  const userPreferences = storedPreferences ?? props.defaultPreferences;
  const contextValue = useMemo(() => ({ userPreferences, setUserPreferences }), [userPreferences, setUserPreferences]);

  return <UserPreferencesContext.Provider value={contextValue}>{props.children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences(): UserPreferencesContextType {
  const ctx = useContext(UserPreferencesContext);
  if (ctx === undefined) {
    throw new Error('No UserPreferencesContext found. Did you forget a Provider?');
  }
  return ctx;
}
