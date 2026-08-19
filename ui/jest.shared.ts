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

import { readFileSync } from 'fs';
import { resolve } from 'path';

import type { Config } from '@jest/types';

const swcrcPath = resolve(__dirname, './.cjs.swcrc');
const swcrc = JSON.parse(readFileSync(swcrcPath, 'utf-8'));

// Common Jest configuration shared across packages
const config: Config.InitialOptions = {
  testEnvironment: 'jsdom',
  setupFiles: [resolve(__dirname, './jest.setup.ts')],
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    // Preserve the subpath (e.g. echarts/core, echarts/charts) so tree-shaken named exports
    // (BarChart, DatasetComponent, etc.) resolve correctly, instead of collapsing to the full
    // `echarts` bundle which doesn't expose those named exports.
    '^echarts/(.*)$': 'echarts/$1',

    // Use polyfill for jsdom environment
    '^use-resize-observer$': 'use-resize-observer/polyfilled',

    // Tell Jest where other Perses packages live since it doesn't know about project references.
    // Exclude `spec` and `dashboards` since they live outside of the perses/ui workspace.
    '^@perses-dev/(?!spec|dashboards|components|client)(.*)$': '<rootDir>/../$1/src',

    // Configure Jest to handle stylesheets
    '\\.(css|less)$': '<rootDir>/../stylesMock.js',
  },
  transformIgnorePatterns: [
    // echarts and zrender ship their `echarts/core`, `echarts/charts`, `echarts/components`,
    // `echarts/renderers` (and internal) entry points as ESM-only source, so they need to be
    // transformed by Jest as well (rather than being treated as pre-compiled CJS).
    'node_modules/(?!(lodash-es|yaml|@uiw/codemirror-extensions-basic-setup|@uiw/react-codemirror|echarts|zrender))',
  ],
  transform: {
    // This does not do type-checking and assumes that's happening elsewhere for TS test files (e.g. as part of the
    // build process)
    // exclude: [] + swcrc: false => https://github.com/swc-project/jest/issues/62
    '^.+\\.(ts|tsx|js|jsx)$': ['@swc/jest', { ...swcrc, exclude: [], swcrc: false }],
  },
};

export default config;
