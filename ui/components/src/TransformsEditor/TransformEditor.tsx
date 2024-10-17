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
          multiple
          freeSolo
          id="join-keys"
          options={[]} // TODO: fill from query data
          value={value.spec.plugin.spec.keys as string[]}
          renderInput={(params) => <TextField {...params} variant="outlined" label="Column(s)" required />}
          onChange={(e, keys: string[]) =>
            onChange({ ...value, spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { keys: keys } } } })
          }
        />
      )}
    </Stack>
  );
}
