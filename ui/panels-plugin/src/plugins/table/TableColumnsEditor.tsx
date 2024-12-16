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

import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { ReactElement } from 'react';
import { ColumnSettings, TableOptions } from './table-model';
import { ColumnsEditor } from './ColumnsEditor';

export type TableColumnsEditorProps = OptionsEditorProps<TableOptions>;

export function TableColumnsEditor({ onChange, value }: TableColumnsEditorProps): ReactElement {
  function handleColumnsChange(columns: ColumnSettings[]): void {
    onChange({ ...value, columnSettings: columns });
  }

  return <ColumnsEditor columnSettings={value.columnSettings ?? []} onChange={handleColumnsChange} />;
}
