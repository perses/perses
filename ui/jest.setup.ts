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

// jsdom does not implement structuredClone; polyfill it with the Node.js built-in.
if (typeof globalThis.structuredClone === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const v8 = require('v8') as typeof import('v8');
  globalThis.structuredClone = <T>(val: T): T => v8.deserialize(v8.serialize(val)) as T;
}

