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

import { MutableRef } from './types';

/**
 * Utility to assign a value to a React ref regardless of its type (callback or object ref)
 * @param ref The React ref to assign to
 * @param value The value to assign to the ref
 */
export function assignRef<T>(ref: MutableRef<T> | null | undefined, value: T): void {
  if (ref) {
    if (typeof ref === 'function') {
      ref(value);
    } else {
      ref.current = value;
    }
  }
}
