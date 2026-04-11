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

import shared from '../jest.shared';
import { resolve } from 'path';

// Extend shared config with mappings for cross-workspace packages
export default {
  ...shared,
  moduleNameMapper: {
    // Map @perses-dev/dashboards to the shared workspace (not in perses/ui)
    '^@perses-dev/dashboards$': resolve(__dirname, '../../../shared/dashboards/src'),

    // Inherit all other mappings from shared config
    ...shared.moduleNameMapper,
  },
};
