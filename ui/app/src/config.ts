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

// Variables here are injected at build time by rspack, see `rspack.config.ts`
export const PERSES_APP_CONFIG = {
  api_prefix: process.env.API_PREFIX ? process.env.API_PREFIX : '',
};

// Make it available in the global window for non-module code
window.PERSES_APP_CONFIG ??= PERSES_APP_CONFIG;

// Allow TypeScript to understand the global
declare global {
  interface Window {
    /**
     * Injected at build time by rspack, see `rspack.config.ts`
     * If you are using this in a module, prefer to import the variable from
     * `<root>/config.ts` instead.
     *
     * @example ```js
     * // in es module code
     * import { PERSES_APP_CONFIG } from '../config';
     * const apiPrefix = PERSES_APP_CONFIG.api_prefix;
     *
     * // in non-module code
     * const apiPrefix = window.PERSES_APP_CONFIG.api_prefix;
     * ```
     */
    PERSES_APP_CONFIG: typeof PERSES_APP_CONFIG;
  }
}
