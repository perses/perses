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

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [
    pluginReact({
      // React 19+ ships the compiler runtime, so the default target needs no extra dependency.
      reactCompiler: true,
    }),
  ],
  tools: {
    rspack: {
      module: {
        rules: [
          // Perses packages are ESM and default-import CommonJS dependencies (e.g. `mdi-material-ui` icons):
          // treat dependencies as auto modules so those default imports resolve to `exports.default`.
          { test: /\.m?js$/, type: 'javascript/auto', resolve: { fullySpecified: false } },
        ],
      },
    },
  },
});
