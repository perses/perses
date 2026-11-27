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

import { useEffect, useMemo, useState } from 'react';

import type { Dashboard } from './parse-dashboard';
import { parseDashboard } from './parse-dashboard';

// Parsing a large YAML dashboard takes ~100ms, so only parse once the definition stops changing.
const PARSE_DELAY_MS = 300;

/**
 * Return the given value once it stopped changing for `delayMs` milliseconds.
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
    return (): void => clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}

interface ParsedDashboard {
  dashboard: Dashboard;
  /** True while the definition changed but isn't parsed yet: `dashboard` is the one of the previous definition. */
  isPending: boolean;
}

/**
 * Parse the given dashboard definition (JSON or YAML) once it stopped changing for `debounceMs` milliseconds.
 */
export function useParsedDashboard(definition: string, debounceMs = PARSE_DELAY_MS): ParsedDashboard {
  const debouncedDefinition = useDebouncedValue(definition, debounceMs);
  // Explicit memoization: the component re-renders on every keystroke, and parsing must only happen
  // when the debounced definition changes, whether or not the React Compiler optimizes the caller.
  const dashboard = useMemo(() => parseDashboard(debouncedDefinition), [debouncedDefinition]);
  return { dashboard, isPending: definition !== debouncedDefinition };
}
