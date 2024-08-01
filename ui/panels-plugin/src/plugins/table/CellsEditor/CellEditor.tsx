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
import { CellSettings } from '../table-model';

type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface CellEditorProps extends Omit<StackProps, OmittedMuiProps> {
  cell: CellSettings;
  onChange: (cell: CellSettings) => void;
}

export function CellEditor({ cell, onChange, ...others }: CellEditorProps) {
  const [width, setWidth] = useState<number>(cell.width === undefined || cell.width === 'auto' ? 100 : cell.width);

  return (
    <Stack gap={2} direction="row" {...others}>
      <Stack gap={2} sx={{ width: '100%' }}>
        <TextField
          label="Name"
          value={cell.name}
          onChange={(e) => onChange({ ...cell, name: e.target.value })}
          required
        />

        <Divider orientation="horizontal" flexItem variant="middle" />

        <TextField
          label="Header"
          value={cell.header ?? ''}
          fullWidth
          onChange={(e) => onChange({ ...cell, header: e.target.value ? e.target.value : undefined })}
        />
        <TextField
          label="Header Description"
          value={cell.headerDescription ?? ''}
          fullWidth
          onChange={(e) => onChange({ ...cell, headerDescription: e.target.value ? e.target.value : undefined })}
        />
        <TextField
          label="Cell Description"
          value={cell.cellDescription ?? ''}
          fullWidth
          onChange={(e) => onChange({ ...cell, cellDescription: e.target.value ? e.target.value : undefined })}
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
              value={cell.align ?? 'left'}
              onChange={(align) => onChange({ ...cell, align: align })}
            />
          }
        />

        <Stack direction="row" alignItems="center" sx={{ width: '100%' }}>
          <FormControlLabel
            label="Hide cell"
            sx={{ width: '100%', alignItems: 'start' }}
            labelPlacement="top"
            control={
              <Switch
                value={cell.hide ?? false}
                checked={cell.hide ?? false}
                onChange={(e) => onChange({ ...cell, hide: e.target.checked })}
              />
            }
          />

          <FormControlLabel
            label="Enable sorting"
            sx={{ width: '100%', alignItems: 'start' }}
            labelPlacement="top"
            control={
              <Switch
                value={cell.enableSorting ?? false}
                checked={cell.enableSorting ?? false}
                onChange={(e) => onChange({ ...cell, enableSorting: e.target.checked })}
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
                checked={cell.width !== undefined && cell.width !== 'auto'}
                onChange={(e) => onChange({ ...cell, width: e.target.checked ? width : 'auto' })}
              />
            }
          />
          <TextField
            label="Width"
            type="number"
            value={width}
            fullWidth
            // set visibility instead of wrapping in a if condition, in order to keep same layout
            sx={{ visibility: cell.width === 'auto' || cell.width === undefined ? 'hidden' : 'visible' }}
            InputProps={{ inputProps: { min: 1 } }}
            onChange={(e) => {
              setWidth(+e.target.value);
              onChange({ ...cell, width: +e.target.value });
            }}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
