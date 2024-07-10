import { ColumnOptions } from '@perses-dev/core';
import { FormControlLabel, MenuItem, Select, Stack, StackProps, Switch, TextField } from '@mui/material';

type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface ColumnEditorProps extends Omit<StackProps, OmittedMuiProps> {
  column: ColumnOptions;
  onChange: (column: ColumnOptions) => void;
}

export function ColumnEditor({ column, onChange, ...others }: ColumnEditorProps) {
  // const [width, setWidth] = useState<number>(50); // TODO

  return (
    <Stack gap={2} {...others}>
      <TextField label="Name" value={column.name} onChange={(e) => onChange({ ...column, name: e.target.value })} />
      <Stack gap={2} direction="row">
        <TextField
          label="Header"
          value={column.header}
          fullWidth
          onChange={(e) => onChange({ ...column, header: e.target.value })}
        />
        <TextField
          label="Header Description"
          value={column.headerDescription}
          fullWidth
          onChange={(e) => onChange({ ...column, headerDescription: e.target.value })}
        />
      </Stack>
      <Stack gap={2} direction="row">
        <TextField
          label="Cell Description"
          value={column.cellDescription}
          fullWidth
          onChange={(e) => onChange({ ...column, cellDescription: e.target.value })}
        />
      </Stack>
      <Stack gap={2} direction="row">
        <FormControlLabel
          label="Enable sorting"
          sx={{ width: '100%' }}
          control={
            <Switch
              checked={column.enableSorting}
              onChange={(e) => onChange({ ...column, enableSorting: e.target.checked })}
            />
          }
        />
        <Select
          label="Alignment"
          size="small"
          value={column.align ?? 'left'}
          fullWidth
          onChange={(e) => onChange({ ...column, align: e.target.value as 'left' | 'center' | 'right' })}
        >
          <MenuItem value="left">Left</MenuItem>
          <MenuItem value="center">Center</MenuItem>
          <MenuItem value="right">Right</MenuItem>
        </Select>
      </Stack>

      <Stack gap={2} direction="row">
        {/* TODO: hide if set to true */}
        <FormControlLabel
          label="Hide"
          sx={{ width: '100%' }}
          control={<Switch checked={column.hide} onChange={(e) => onChange({ ...column, hide: e.target.checked })} />}
        />
        <FormControlLabel
          label="Custom width"
          sx={{ width: '100%' }}
          control={
            <Switch
              checked={column.width !== undefined && column.width !== 'auto'}
              onChange={(e) => onChange({ ...column, width: e.target.checked ? 50 : 'auto' })}
            />
          }
        />
        <TextField
          label="Width"
          type="number"
          value={column.width ?? 50}
          fullWidth
          // set visibility instead of wrapping in a if condition, in order to keep same layout
          sx={{ visibility: column.width === 'auto' || column.width === undefined ? 'hidden' : 'visible' }}
          InputProps={{ inputProps: { min: 1 } }}
          onChange={(e) => onChange({ ...column, width: +e.target.value })}
        />
      </Stack>
    </Stack>
  );
}
