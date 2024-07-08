// Copyright 2024 The Perses Authors
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

import { Definition } from '@perses-dev/core';

/**
 * The schema for a Table panel.
 */
export interface TableDefinition extends Definition<TableOptions> {
  kind: 'Table';
}

/**
 * The Options object type supported by the Table panel plugin.
 */
export interface TableOptions {}

/**
 * Creates the initial/empty options for a Table panel.
 */
export function createInitialTableOptions(): TableOptions {
  return {};
}
