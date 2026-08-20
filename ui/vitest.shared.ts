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

import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Common Vitest configuration shared across packages
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Use polyfill for jsdom environment
      { find: 'use-resize-observer', replacement: 'use-resize-observer/polyfilled' },

      // Tell Vitest where other Perses packages live since it doesn't know about project references.
      // Exclude `spec` and `dashboards` since they live outside of the perses/ui workspace.
      { find: /^@perses-dev\/(?!spec|dashboards|components|client)(.*)$/, replacement: resolve(__dirname, '$1/src') },

      // Configure Vitest to handle stylesheets
      { find: /\.(css|less)$/, replacement: resolve(__dirname, './stylesMock.js') },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './vitest.setup.ts')],
  },
});
