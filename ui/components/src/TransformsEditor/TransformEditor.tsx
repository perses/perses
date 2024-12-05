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
  Autocomplete,
  FormControlLabel,
  MenuItem,
  Stack,
  StackProps,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  JoinByColumnValueTransform,
  MergeColumnsTransform,
  MergeIndexedColumnsTransform,
  MergeSeriesTransform,
  Transform,
} from '@perses-dev/core';

interface TransformSpecEditorProps<Spec> {
  value: Spec;
  onChange: (transform: Spec) => void;
}

function JoinByColumnValueTransformEditor({ value, onChange }: TransformSpecEditorProps<JoinByColumnValueTransform>) {
  return (
    <Stack direction="row">
      <Autocomplete
        freeSolo
        multiple
        id="join-columns"
        sx={{ width: '100%' }}
        options={[]}
        value={value.spec.columns ?? []}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Columns" required />}
        onChange={(_, columns) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              columns: columns,
            },
          });
        }}
      />
      <FormControlLabel
        label="Enabled"
        labelPlacement="start"
        control={
          <Switch
            value={!value.spec.disabled}
            checked={!value.spec.disabled}
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
  );
}

function MergeColumnsTransformEditor({ value, onChange }: TransformSpecEditorProps<MergeColumnsTransform>) {
  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Autocomplete
        freeSolo
        multiple
        id="merge-columns-columns"
        sx={{ width: '100%' }}
        options={[]}
        value={value.spec.columns ?? []}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Columns" required />}
        onChange={(_, columns) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              columns: columns,
            },
          });
        }}
      />

      <TextField
        id="merge-columns-name"
        variant="outlined"
        label="Output Name"
        value={value.spec.name ?? ''}
        sx={{ width: '100%' }}
        onChange={(e) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              name: e.target.value,
            },
          });
        }}
        required
      />
      <FormControlLabel
        label="Enabled"
        labelPlacement="start"
        control={
          <Switch
            value={!value.spec.disabled}
            checked={!value.spec.disabled}
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
  );
}

function MergeIndexedColumnsTransformEditor({
  value,
  onChange,
}: TransformSpecEditorProps<MergeIndexedColumnsTransform>) {
  return (
    <Stack direction="row">
      <TextField
        id="merge-indexed-columns"
        variant="outlined"
        label="Column"
        placeholder="Example: 'value' for merging 'value #1', 'value #2' and 'value #...'"
        value={value.spec.column ?? ''}
        sx={{ width: '100%' }}
        onChange={(e) => {
          onChange({
            ...value,
            spec: { ...value.spec, column: e.target.value },
          });
        }}
        required
      />
      <FormControlLabel
        label="Enabled"
        labelPlacement="start"
        control={
          <Switch
            value={!value.spec.disabled}
            checked={!value.spec.disabled}
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
  );
}

function MergeSeriesTransformEditor({ value, onChange }: TransformSpecEditorProps<MergeSeriesTransform>) {
  return (
    <Stack direction="row">
      <FormControlLabel
        label="Enabled"
        labelPlacement="start"
        control={
          <Switch
            value={!value.spec.disabled}
            checked={!value.spec.disabled}
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
  );
}

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
        value={value.kind}
        onChange={(e) => onChange({ ...value, kind: e.target.value as unknown as Transform['kind'] } as Transform)}
      >
        <MenuItem value="JoinByColumnValue">
          <Stack>
            <Typography>Join by column value</Typography>
            <Typography variant="caption">Regroup rows with equal cell value in a column</Typography>
          </Stack>
        </MenuItem>
        <MenuItem value="MergeColumns">
          <Stack>
            <Typography>Merge columns</Typography>
            <Typography variant="caption">Multiple columns are merged to one column</Typography>
          </Stack>
        </MenuItem>
        <MenuItem value="MergeIndexedColumns">
          <Stack>
            <Typography>Merge indexed columns</Typography>
            <Typography variant="caption">Indexed columns are merged to one column</Typography>
          </Stack>
        </MenuItem>
        <MenuItem value="MergeSeries">
          <Stack>
            <Typography>Merge series</Typography>
            <Typography variant="caption">Series will be merged by their labels</Typography>
          </Stack>
        </MenuItem>
      </TextField>
      {value.kind === 'JoinByColumnValue' && <JoinByColumnValueTransformEditor value={value} onChange={onChange} />}
      {value.kind === 'MergeColumns' && <MergeColumnsTransformEditor value={value} onChange={onChange} />}
      {value.kind === 'MergeIndexedColumns' && <MergeIndexedColumnsTransformEditor value={value} onChange={onChange} />}
      {value.kind === 'MergeSeries' && <MergeSeriesTransformEditor value={value} onChange={onChange} />}
    </Stack>
  );
}
