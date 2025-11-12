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

import { useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useArrayMemo = <T extends any[]>(array: T): T => {
  const ref = useRef<T>();

  const isSame =
    ref.current && array.length === ref.current.length
      ? array.every((entry, i) => {
          const prevEntry = ref.current![i];
          const values = Object.values(entry);
          const prevValues = Object.values(prevEntry);
          return values.length === prevValues.length && values.every((v, vi) => v === prevValues[vi]);
        })
      : false;

  useEffect(() => {
    if (!isSame) ref.current = array;
  }, [isSame, array]);

  return isSame ? ref.current! : array;
};
