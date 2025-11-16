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

// LOGZ.IO CHANGE FILE:: Performance optimization [APPZ-359]

import { useQueries } from '@tanstack/react-query';
import { useArrayMemo } from './array-memo';

/**
 * Creates a stable reference of the `useQueries` response.
 *
 * This is useful because `useQueries` returns a new array on every render,
 * which can trigger unnecessary re-renders or effect executions in components
 * that depend on it. By stabilizing the reference with `useArrayMemo`,
 * this hook ensures that downstream components only update when the actual
 * query results change, improving performance and preventing redundant updates.
 */
export function useStableQueries<T extends unknown[], TCombinedResult = ReturnType<typeof useQueries<T>>>(
  opts: Parameters<typeof useQueries<T>>[0]
): TCombinedResult {
  const results = useQueries<T>(opts);

  const stableResults = useArrayMemo(results);

  return stableResults as unknown as TCombinedResult;
}
