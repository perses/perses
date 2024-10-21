import {
  Autocomplete,
  FormControlLabel,
  MenuItem,
  Stack,
  StackProps,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Transform } from '@perses-dev/core';

export interface TransformEditorProps extends Omit<StackProps, 'children' | 'value' | 'onChange'> {
  value: Transform;
  onChange: (transform: Transform) => void;
}

export function TransformEditor({ value, onChange, ...props }: TransformEditorProps) {
  return (
    <Stack gap={2} sx={{ width: '100%' }} mt={1} {...props}>
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
            <Typography>Join by column value</Typography>
            <Typography variant="caption">Regroup rows with equal cell value in a column</Typography>
          </Stack>
        </MenuItem>
        <MenuItem value="MergeIndexedColumns">
          <Stack>
            <Typography>Merge indexed columns</Typography>
            <Typography variant="caption">All indexed columns are merged to one column</Typography>
          </Stack>
        </MenuItem>
      </TextField>
      {value.spec.plugin.kind === 'JoinByColumnValue' && (
        <Stack direction="row">
          <TextField
            id="join-column"
            variant="outlined"
            label="Column"
            value={value.spec.plugin.spec.column as string}
            sx={{ width: '100%' }}
            onChange={(e) => {
              onChange({
                ...value,
                spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { column: e.target.value } } },
              });
            }}
            required
          />
          <FormControlLabel
            label="Enabled"
            labelPlacement="start"
            control={
              <Switch
                value={!value.spec.disabled ?? true}
                checked={!value.spec.disabled ?? true}
                onChange={(e) =>
                  onChange({
                    ...value,
                    spec: { ...value.spec, disabled: !e.target.checked },
                  })
                }
              />
            }
          />
        </Stack>
      )}
      {value.spec.plugin.kind === 'MergeIndexedColumns' && (
        <Stack direction="row">
          <TextField
            id="merge-column"
            variant="outlined"
            label="Column"
            placeholder="Example: 'value' for merging 'value #1', 'value #2' and 'value #...'"
            value={value.spec.plugin.spec.column as string}
            sx={{ width: '100%' }}
            onChange={(e) => {
              onChange({
                ...value,
                spec: { ...value.spec, plugin: { ...value.spec.plugin, spec: { column: e.target.value } } },
              });
            }}
            required
          />
          <FormControlLabel
            label="Enabled"
            labelPlacement="start"
            control={
              <Switch
                value={!value.spec.disabled ?? true}
                checked={!value.spec.disabled ?? true}
                onChange={(e) =>
                  onChange({
                    ...value,
                    spec: { ...value.spec, disabled: !e.target.checked },
                  })
                }
              />
            }
          />
        </Stack>
      )}
    </Stack>
  );
}
