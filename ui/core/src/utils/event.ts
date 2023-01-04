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

import { useRef, useLayoutEffect, useCallback } from 'react';

/**
 * A (temporary) userland implementation of `useEvent` from this React RFC: https://github.com/reactjs/rfcs/pull/220.
 *
 * Typically useful for getting a stable reference to an "event" function (i.e. one that isn't called during render
 * but is called later in a useEffect or event handler) that accesses state or props.
 */
export function useEvent<T extends unknown[], U>(handler: (...args: T) => U): (...args: T) => U {
  const handlerRef = useRef(handler);
  useLayoutEffect(() => {
    handlerRef.current = handler;
  });

  return useCallback((...args) => handlerRef.current(...args), []);
}
