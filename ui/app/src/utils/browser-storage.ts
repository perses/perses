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

import { useState, useCallback } from 'react';

type StorageTuple<T> = [T, (next: T) => void];

/**
 * Just like useState but gets/sets the value in the browser's local storage.
 * 'key' should be a constant string. 'initialValue' is returned when local
 * storage does not have any data yet.
 */
export function useLocalStorage<T>(key: string, initialValue: T): StorageTuple<T> {
  const { value, setValueAndStore } = useStorage(global.localStorage, key, initialValue);
  return [value, setValueAndStore];
}

// Common functionality used by all storage hooks
function useStorage<T>(storage: Storage, key: string, initialValue: T) {
  // Use state so that changes cause the page to re-render
  const [value, setValue] = useState<T>(() => {
    try {
      const json = storage.getItem(key);
      if (json !== null) {
        return JSON.parse(json);
      }
    } catch {
      // No-op
    }

    // Either the value isn't in storage yet or JSON parsing failed, so
    // set to the initial value in both places
    storage.setItem(key, JSON.stringify(initialValue));
    return initialValue;
  });

  // Set in both places
  const setValueAndStore = useCallback(
    (val: T) => {
      setValue(val);
      storage.setItem(key, JSON.stringify(val));
    },
    [setValue, storage, key]
  );

  return { value, setValue, setValueAndStore };
}
