import { ColumnDefinition } from '@perses-dev/core';
import { Divider, FormControlLabel, Stack, StackProps, Switch, TextField } from '@mui/material';
import { useState } from 'react';
import { AlignSelector } from '../AlignSelector';

type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface ColumnEditorProps extends Omit<StackProps, OmittedMuiProps> {
  column: ColumnDefinition;
  onChange: (column: ColumnDefinition) => void;
}

export function ColumnEditor({ column, onChange, ...others }: ColumnEditorProps) {
  const [width, setWidth] = useState<number>(
    column.width === undefined || column.width === 'auto' ? 100 : column.width
  );

  return (
    <Stack gap={2} {...others}>
      <TextField label="Name" value={column.name} onChange={(e) => onChange({ ...column, name: e.target.value })} />
      <Stack gap={2} direction="row">
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
      </Stack>
      <Stack gap={2} direction="row">
        <TextField
          label="Cell Description"
          value={column.cellDescription ?? ''}
          fullWidth
          onChange={(e) => onChange({ ...column, cellDescription: e.target.value ? e.target.value : undefined })}
        />
      </Stack>
      <Stack gap={2} direction="row" justifyContent="space-between">
        <AlignSelector
          size="small"
          value={column.align ?? 'left'}
          onChange={(align) => onChange({ ...column, align: align })}
        />

        <Divider orientation="vertical" flexItem />

        <FormControlLabel
          label="Enable sorting"
          sx={{ width: '100%' }}
          control={
            <Switch
              checked={column.enableSorting ?? true}
              onChange={(e) => onChange({ ...column, enableSorting: e.target.checked })}
            />
          }
        />
        <Divider orientation="vertical" flexItem />

        <FormControlLabel
          label="Custom width"
          sx={{ width: '100%' }}
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
  );
}
