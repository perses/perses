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
  JoinByColumnValueTransformSpec,
  MergeColumnsTransformSpec,
  MergeIndexedColumnsTransformSpec,
  MergeSeriesTransformSpec,
  Transform,
} from '@perses-dev/core';

interface TransformSpecEditorProps<Spec> {
  value: Transform<Spec>;
  onChange: (transform: Transform<Spec>) => void;
}

function JoinByColumnValueTransformEditor({
  value,
  onChange,
}: TransformSpecEditorProps<JoinByColumnValueTransformSpec>) {
  return (
    <Stack direction="row">
      <Autocomplete
        freeSolo
        multiple
        id="join-columns"
        sx={{ width: '100%' }}
        options={[]}
        value={value.spec.plugin.spec.columns ?? []}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Columns" required />}
        onChange={(_, columns) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              plugin: { ...value.spec.plugin, spec: { ...value.spec.plugin.spec, columns: columns } },
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

function MergeColumnsTransformEditor({ value, onChange }: TransformSpecEditorProps<MergeColumnsTransformSpec>) {
  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Autocomplete
        freeSolo
        multiple
        id="merge-columns-columns"
        sx={{ width: '100%' }}
        options={[]}
        value={value.spec.plugin.spec.columns ?? []}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Columns" required />}
        onChange={(_, columns) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              plugin: { ...value.spec.plugin, spec: { ...value.spec.plugin.spec, columns: columns } },
            },
          });
        }}
      />

      <TextField
        id="merge-columns-name"
        variant="outlined"
        label="Output Name"
        value={value.spec.plugin.spec.name ?? ''}
        sx={{ width: '100%' }}
        onChange={(e) => {
          onChange({
            ...value,
            spec: {
              ...value.spec,
              plugin: { ...value.spec.plugin, spec: { ...value.spec.plugin.spec, name: e.target.value } },
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
}: TransformSpecEditorProps<MergeIndexedColumnsTransformSpec>) {
  return (
    <Stack direction="row">
      <TextField
        id="merge-indexed-columns"
        variant="outlined"
        label="Column"
        placeholder="Example: 'value' for merging 'value #1', 'value #2' and 'value #...'"
        value={value.spec.plugin.spec.column ?? ''}
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

function MergeSeriesTransformEditor({ value, onChange }: TransformSpecEditorProps<MergeSeriesTransformSpec>) {
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
      {value.spec.plugin.kind === 'JoinByColumnValue' && (
        <JoinByColumnValueTransformEditor
          value={value as unknown as Transform<JoinByColumnValueTransformSpec>}
          onChange={onChange as unknown as (transform: Transform<JoinByColumnValueTransformSpec>) => void}
        />
      )}
      {value.spec.plugin.kind === 'MergeColumns' && (
        <MergeColumnsTransformEditor
          value={value as unknown as Transform<MergeColumnsTransformSpec>}
          onChange={onChange as unknown as (transform: Transform<MergeColumnsTransformSpec>) => void}
        />
      )}
      {value.spec.plugin.kind === 'MergeIndexedColumns' && (
        <MergeIndexedColumnsTransformEditor
          value={value as unknown as Transform<MergeIndexedColumnsTransformSpec>}
          onChange={onChange as unknown as (transform: Transform<MergeIndexedColumnsTransformSpec>) => void}
        />
      )}
      {value.spec.plugin.kind === 'MergeSeries' && (
        <MergeSeriesTransformEditor
          value={value as unknown as Transform<MergeSeriesTransformSpec>}
          onChange={onChange as unknown as (transform: Transform<MergeSeriesTransformSpec>) => void}
        />
      )}
    </Stack>
  );
}
