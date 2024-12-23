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
import { Transform } from '@perses-dev/core';
import { TransformsEditor } from '@perses-dev/components';
import { ReactElement } from 'react';
import { TableOptions } from './table-model';

export type TableSettingsEditorProps = OptionsEditorProps<TableOptions>;

export function TableTransformsEditor({ value, onChange }: TableSettingsEditorProps): ReactElement {
  function handleTransformsChange(transforms: Transform[]): void {
    onChange({ ...value, transforms: transforms });
  }

  return <TransformsEditor value={value.transforms ?? []} onChange={handleTransformsChange} />;
}
