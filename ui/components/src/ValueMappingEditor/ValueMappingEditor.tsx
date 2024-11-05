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

import { GridProps, IconButton, MenuItem, Stack, StackProps, TextField, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import { ValueMapping } from '@perses-dev/core';
import { OptionsColorPicker } from '../ColorPicker/OptionsColorPicker';

interface ValueMappingConditionEditorProps extends Omit<StackProps, 'onChange'> {
  mapping: ValueMapping;
  onChange: (condition: ValueMapping) => void;
}

function ConditionEditor({ mapping, onChange, ...props }: ValueMappingConditionEditorProps) {
  switch (mapping.kind) {
    case 'Value':
      return (
        <Stack gap={1} direction="row" {...props}>
          <TextField
            label="Value"
            placeholder="Exact value"
            value={mapping.spec?.value ?? ''}
            onChange={(e) =>
              onChange({
                ...mapping,
                spec: { ...mapping.spec, value: e.target.value },
              })
            }
            fullWidth
          />
        </Stack>
      );
    case 'Range':
      return (
        <Stack gap={1} direction="row" {...props}>
          <TextField
            label="From"
            placeholder="Start of range"
            value={mapping.spec?.from ?? ''}
            onChange={(e) => onChange({ ...mapping, spec: { ...mapping.spec, from: +e.target.value } })}
            fullWidth
          />
          <TextField
            label="To"
            placeholder="End of range (inclusive)"
            value={mapping.spec?.to ?? ''}
            onChange={(e) => onChange({ ...mapping, spec: { ...mapping.spec, to: +e.target.value } })}
            fullWidth
          />
        </Stack>
      );
    case 'Regex':
      return (
        <Stack gap={1} direction="row" {...props}>
          <TextField
            label="Regular Expression"
            placeholder="JavaScript regular expression"
            value={mapping.spec?.pattern ?? ''}
            onChange={(e) => onChange({ ...mapping, spec: { ...mapping.spec, pattern: e.target.value } })}
            fullWidth
          />
        </Stack>
      );
    case 'Misc':
      return (
        <Stack gap={1} direction="row" {...props}>
          <TextField
            select
            label="Value"
            value={mapping.spec?.value ?? ''}
            onChange={(e) => onChange({ ...mapping, spec: { value: e.target.value } } as ValueMapping)}
            SelectProps={{
              renderValue: (selected) => {
                switch (selected) {
                  case 'empty':
                    return 'Empty';
                  case 'null':
                    return 'Null';
                  case 'NaN':
                    return 'NaN';
                  case 'true':
                    return 'True';
                  case 'false':
                    return 'False';
                  default:
                    return String(selected);
                }
              },
            }}
            fullWidth
          >
            <MenuItem value="empty">
              <Stack>
                <Typography>Empty</Typography>
                <Typography variant="caption">Matches empty string</Typography>
              </Stack>
            </MenuItem>
            <MenuItem value="null">
              <Stack>
                <Typography>Null</Typography>
                <Typography variant="caption">Matches null or undefined</Typography>
              </Stack>
            </MenuItem>
            <MenuItem value="NaN">
              <Stack>
                <Typography>NaN</Typography>
                <Typography variant="caption">Matches Not a Number value</Typography>
              </Stack>
            </MenuItem>
            <MenuItem value="true">
              <Stack>
                <Typography>True</Typography>
                <Typography variant="caption">Matches true boolean</Typography>
              </Stack>
            </MenuItem>
            <MenuItem value="false">
              <Stack>
                <Typography>False</Typography>
                <Typography variant="caption">Matches false boolean</Typography>
              </Stack>
            </MenuItem>
          </TextField>
        </Stack>
      );
    default:
      return null;
  }
}
export interface ValueMappingEditorProps extends Omit<GridProps, 'onChange'> {
  mapping: ValueMapping;
  onChange: (mapping: ValueMapping) => void;
  onDelete: () => void;
}

export function ValueMappingEditor({ mapping, onChange, onDelete, ...props }: ValueMappingEditorProps) {
  const handleColorChange = (color?: string) => {
    onChange({
      ...mapping,
      spec: {
        ...mapping.spec,
        result: {
          ...mapping.spec.result,
          color,
        },
      },
    } as ValueMapping);
  };
  return (
    <Grid container spacing={2} {...props}>
      <Grid xs={5}>
        <Stack direction="row" gap={1} width="100%">
          <TextField
            select
            label="Type"
            value={mapping.kind}
            onChange={(e) => onChange({ ...mapping, kind: e.target.value } as ValueMapping)}
            required
            sx={{ width: '120px' }}
          >
            <MenuItem value="Value">
              <Stack>
                <Typography>Value</Typography>
                {mapping.kind !== 'Value' && <Typography variant="caption">Matches an exact text value</Typography>}
              </Stack>
            </MenuItem>
            <MenuItem value="Range">
              <Stack>
                <Typography>Range</Typography>
                {mapping.kind !== 'Range' && (
                  <Typography variant="caption">Matches against a numerical range</Typography>
                )}
              </Stack>
            </MenuItem>
            <MenuItem value="Regex">
              <Stack>
                <Typography>Regex</Typography>
                {mapping.kind !== 'Regex' && (
                  <Typography variant="caption">Matches against a regular expression</Typography>
                )}
              </Stack>
            </MenuItem>
            <MenuItem value="Misc">
              <Stack>
                <Typography>Misc</Typography>
                {mapping.kind !== 'Misc' && (
                  <Typography variant="caption">Matches against empty, null and NaN values</Typography>
                )}
              </Stack>
            </MenuItem>
          </TextField>
          <ConditionEditor
            width="100%"
            mapping={mapping}
            onChange={(updatedMapping) => onChange({ ...mapping, ...updatedMapping })}
          />
        </Stack>
      </Grid>
      <Grid xs={4}>
        <TextField
          label="Display text"
          value={mapping.spec?.result?.value ?? ''}
          onChange={(e) =>
            onChange({
              ...mapping,
              spec: {
                ...mapping.spec,
                result: {
                  ...mapping.spec?.result,
                  value: e.target.value,
                },
              },
            } as ValueMapping)
          }
          fullWidth
        />
      </Grid>
      <Grid xs={1}>
        <Stack direction="row" justifyContent="center" gap={1}>
          {mapping.spec?.result?.color ? (
            <OptionsColorPicker
              label="Color"
              color={mapping.spec.result.color ?? '#000'}
              onColorChange={handleColorChange}
              onClear={() => handleColorChange(undefined)}
            />
          ) : (
            <IconButton onClick={() => handleColorChange('#000')}>
              <PlusIcon />
            </IconButton>
          )}
        </Stack>
      </Grid>
      <Grid xs={1} textAlign="end">
        <Tooltip title="Remove mapping settings" placement="top">
          <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
