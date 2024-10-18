import { Autocomplete, MenuItem, Stack, StackProps, TextField, Typography } from '@mui/material';
import { Transform } from '@perses-dev/core';

export interface TransformEditorProps extends Omit<StackProps, 'children' | 'value' | 'onChange'> {
  value: Transform;
  onChange: (transform: Transform) => void;
}

export function TransformEditor({ value, onChange, ...props }: TransformEditorProps) {
  return (
    <Stack gap={2} sx={{ width: '100%' }} {...props}>
      <TextField
        select
        label="Kind"
        value={value.spec.plugin.kind}
        onChange={(e) =>
          onChange({ ...value, spec: { ...value.spec, plugin: { ...value.spec.plugin, kind: e.target.value } } })
        }
      >
        <MenuItem value="JoinByColumnValue">
          <Stack>
            <Typography>Join by field</Typography>
            <Typography variant="caption">Regroup row with equal fields values</Typography>
          </Stack>
        </MenuItem>
        <MenuItem value="MergeIndexedColumns">
          <Stack>
            <Typography>Merge indexed columns</Typography>
            <Typography variant="caption">All indexed column are merged to one column</Typography>
          </Stack>
        </MenuItem>
      </TextField>
      {value.spec.plugin.kind === 'JoinByColumnValue' && (
        <Autocomplete
          freeSolo
          id="join-column"
          options={[]} // TODO: fill from query data when query result will be available at settings level
          value={value.spec.plugin.spec.column as string}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Column" required />}
          onChange={(e, column: string | null) => {
            if (column === null) {
              onChange({
                ...value,
                spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { column: undefined } } }, // TODO
              });
            } else {
              onChange({
                ...value,
                spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { column: column } } },
              });
            }
          }}
        />
      )}
      {value.spec.plugin.kind === 'MergeIndexedColumns' && (
        <Autocomplete
          freeSolo
          id="merge-column"
          options={[]} // TODO: fill from query data when query result will be available at settings level
          value={value.spec.plugin.spec.column as string}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Column" required />}
          onChange={(e, column: string | null) => {
            if (column === null) {
              onChange({
                ...value,
                spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { column: undefined } } }, // TODO
              });
            } else {
              onChange({
                ...value,
                spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { column: column } } },
              });
            }
          }}
        />
      )}
    </Stack>
  );
}
