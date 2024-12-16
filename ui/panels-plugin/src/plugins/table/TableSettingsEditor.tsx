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

import {
  DensitySelector,
  OptionsEditorColumn,
  OptionsEditorControl,
  OptionsEditorGrid,
  OptionsEditorGroup,
  TableDensity,
  DEFAULT_COLUMN_WIDTH,
} from '@perses-dev/components';
import { OptionsEditorProps } from '@perses-dev/plugin-system';
import { Switch, TextField } from '@mui/material';
import { ChangeEvent, ReactElement } from 'react';
import { TableOptions } from './table-model';

function DefaultColumnsWidthControl({
  value,
  onChange,
}: {
  value?: 'auto' | number;
  onChange: (defaultWidth: 'auto' | number) => void;
}): ReactElement {
  function handleAutoWidthChange(_: ChangeEvent, checked: boolean): void {
    if (checked) {
      return onChange('auto');
    }
    onChange(DEFAULT_COLUMN_WIDTH);
  }

  return (
    <>
      <OptionsEditorControl
        label="Auto Columns Width"
        control={<Switch checked={value === 'auto'} onChange={handleAutoWidthChange} />}
      />
      {value !== 'auto' && (
        <OptionsEditorControl
          label="Default Columns Width"
          control={
            <TextField
              type="number"
              value={value ?? DEFAULT_COLUMN_WIDTH}
              InputProps={{ inputProps: { min: 1, step: 1 } }}
              onChange={(e) => onChange(parseInt(e.target.value))}
            />
          }
        />
      )}
    </>
  );
}

export type TableSettingsEditorProps = OptionsEditorProps<TableOptions>;

export function TableSettingsEditor({ onChange, value }: TableSettingsEditorProps): ReactElement {
  function handleDensityChange(density: TableDensity): void {
    onChange({ ...value, density: density });
  }

  function handleAutoWidthChange(newValue: 'auto' | number): void {
    onChange({ ...value, defaultColumnWidth: newValue });
  }

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Display">
          <DensitySelector value={value.density} onChange={handleDensityChange} />
          <DefaultColumnsWidthControl value={value.defaultColumnWidth} onChange={handleAutoWidthChange} />
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
