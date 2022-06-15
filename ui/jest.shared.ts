// Copyright 2022 The Perses Authors
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

import type { Config } from '@jest/types';

// Common Jest configuration shared across packages
const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    // Jest currently doesn't natively support ES Modules, so use the non ES Modules versions instead
    '^lodash-es$': 'lodash',
    '^echarts/(.*)$': 'echarts',

    // Use polyfill for jsdom environment
    '^use-resize-observer$': 'use-resize-observer/polyfilled',

    // Tell Jest where other Perses packages live since it doesn't know about project references
    '^@perses-dev/(.*)$': '<rootDir>/../$1/src',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.test.json',
    },
  },
};

export default config;
