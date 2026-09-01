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

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const uiRoot = fileURLToPath(new URL('.', import.meta.url));

// Common Vitest configuration shared across packages
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Use polyfill for jsdom environment
      { find: 'use-resize-observer', replacement: 'use-resize-observer/polyfilled' },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [resolve(uiRoot, './vitest.setup.ts')],
    server: {
      deps: {
        // Shared packages now ship ESM with extensionless imports into CommonJS dependencies.
        // Keep them in Vite's module graph so its resolver can handle those imports.
        inline: [/@perses-dev\//, /lodash/, /mdi-material-ui/],
      },
    },
  },
});
