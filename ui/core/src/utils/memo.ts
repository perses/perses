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

import { useRef, DependencyList } from 'react';
import isEqual from 'lodash/isEqual';

type MemoRef<T> = {
  value: T;
  deps: DependencyList;
};

/**
 * Like React's useMemo, but guarantees the value will only be recalulated if
 * a dependency changes. Uses strict equality (===) for comparison. (React's
 * useMemo does not offer this guarantee, it's only a performance optimization).
 */
export function useMemoized<T>(factory: () => T, deps: DependencyList) {
  const ref = useRef<MemoRef<T>>();

  let areEqual = true;
  for (let i = 0; i < deps.length; i++) {
    if (ref.current?.deps[i] !== deps[i]) {
      areEqual = false;
      break;
    }
  }

  if (ref.current === undefined || areEqual === false) {
    ref.current = { value: factory(), deps: deps };
  }

  return ref.current.value;
}

/**
 * Like React's useMemo, except it does a deep equality comparison with lodash's
 * isEqual on the dependency list.
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<MemoRef<T>>();
  if (ref.current === undefined || isEqual(deps, ref.current.deps) === false) {
    ref.current = { value: factory(), deps };
  }
  return ref.current.value;
}
