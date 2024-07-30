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

import { Divider, FormControlLabel, Stack, StackProps, Switch, TextField } from '@mui/material';
import { useState } from 'react';
import { AlignSelector } from '@perses-dev/components';
import { ColumnSettings } from '../table-model';

type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface ColumnEditorProps extends Omit<StackProps, OmittedMuiProps> {
  column: ColumnSettings;
  onChange: (column: ColumnSettings) => void;
}

export function ColumnEditor({ column, onChange, ...others }: ColumnEditorProps) {
  const [width, setWidth] = useState<number>(
    column.width === undefined || column.width === 'auto' ? 100 : column.width
  );

  return (
    <Stack gap={2} direction="row" {...others}>
      <Stack gap={2} sx={{ width: '100%' }}>
        <TextField
          label="Name"
          value={column.name}
          onChange={(e) => onChange({ ...column, name: e.target.value })}
          required
        />

        <Divider orientation="horizontal" flexItem variant="middle" />

        <TextField
          label="Header"
          value={column.header ?? ''}
          fullWidth
          onChange={(e) => onChange({ ...column, header: e.target.value ? e.target.value : undefined })}
        />
        <TextField
          label="Header Description"
          value={column.headerDescription ?? ''}
          fullWidth
          onChange={(e) => onChange({ ...column, headerDescription: e.target.value ? e.target.value : undefined })}
        />
        <TextField
          label="Cell Description"
          value={column.cellDescription ?? ''}
          fullWidth
          onChange={(e) => onChange({ ...column, cellDescription: e.target.value ? e.target.value : undefined })}
        />
      </Stack>

      <Divider orientation="vertical" flexItem />

      <Stack gap={2} justifyContent="space-between" alignItems="start">
        <FormControlLabel
          label="Alignment"
          sx={{ width: '100%', alignItems: 'start' }}
          labelPlacement="top"
          control={
            <AlignSelector
              size="medium"
              value={column.align ?? 'left'}
              onChange={(align) => onChange({ ...column, align: align })}
            />
          }
        />

        <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
          <FormControlLabel
            label="Hide column"
            sx={{ width: '100%', alignItems: 'start' }}
            labelPlacement="top"
            control={
              <Switch
                value={column.hide ?? false}
                checked={column.hide ?? false}
                onChange={(e) => onChange({ ...column, hide: e.target.checked })}
              />
            }
          />

          <FormControlLabel
            label="Enable sorting"
            sx={{ width: '100%', alignItems: 'start' }}
            labelPlacement="top"
            control={
              <Switch
                value={column.enableSorting ?? false}
                checked={column.enableSorting ?? false}
                onChange={(e) => onChange({ ...column, enableSorting: e.target.checked })}
              />
            }
          />
        </Stack>

        <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
          <FormControlLabel
            label="Custom width"
            sx={{ width: '100%', alignItems: 'start' }}
            labelPlacement="top"
            control={
              <Switch
                checked={column.width !== undefined && column.width !== 'auto'}
                onChange={(e) => onChange({ ...column, width: e.target.checked ? width : 'auto' })}
              />
            }
          />
          <TextField
            label="Width"
            type="number"
            value={width}
            fullWidth
            // set visibility instead of wrapping in a if condition, in order to keep same layout
            sx={{ visibility: column.width === 'auto' || column.width === undefined ? 'hidden' : 'visible' }}
            InputProps={{ inputProps: { min: 1 } }}
            onChange={(e) => {
              setWidth(+e.target.value);
              onChange({ ...column, width: +e.target.value });
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
