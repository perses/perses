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
        <MenuItem value="Join">
          <Stack>
            <Typography>Join by field(s)</Typography>
            <Typography variant="caption">Regroup row with equal fields values</Typography>
          </Stack>
        </MenuItem>
      </TextField>
      {value.spec.plugin.kind === 'Join' && (
        <Autocomplete
          freeSolo
          id="join-key"
          options={[]} // TODO: fill from query data when query result will be available at settings level
          value={value.spec.plugin.spec.key as string}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Column" required />}
          onChange={(e, key: string | null) => {
            if (key === null) {
              onChange({
                ...value,
                spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { key: undefined } } }, // TODO
              });
            } else {
              onChange({ ...value, spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { key: key } } } });
            }
          }}
        />
      )}
    </Stack>
  );
}
