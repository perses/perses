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

import { PanelPlugin } from '@perses-dev/plugin-system';
import { createInitialTableOptions, TableOptions } from './table-model';
import { TablePanel } from './TablePanel';
import { TableColumnsEditor } from './TableColumnsEditor';
import { TableSettingsEditor } from './TableSettingsEditor';
import { TableCellsEditor } from './TableCellsEditor';
import { TableTransformsEditor } from './TableTransformsEditor';

/**
 * The core TimeSeriesTable panel plugin for Perses.
 */
export const Table: PanelPlugin<TableOptions> = {
  PanelComponent: TablePanel,
  supportedQueryTypes: ['TimeSeriesQuery'],
  queryOptions: {
    mode: 'instant',
  },
  panelOptionsEditorComponents: [
    { label: 'General Settings', content: TableSettingsEditor },
    { label: 'Column Settings', content: TableColumnsEditor },
    { label: 'Cell Settings', content: TableCellsEditor },
    { label: 'Transforms', content: TableTransformsEditor },
  ],
  createInitialOptions: createInitialTableOptions,
};
