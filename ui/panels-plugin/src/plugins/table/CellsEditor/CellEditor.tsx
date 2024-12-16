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
  Grid2Props as GridProps,
  IconButton,
  MenuItem,
  Stack,
  StackProps,
  TextField,
  Tooltip,
  Typography,
  Grid2 as Grid,
} from '@mui/material';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import { OptionsColorPicker } from '@perses-dev/components';
import PlusIcon from 'mdi-material-ui/Plus';
import { ReactElement } from 'react';
import { CellSettings, Condition } from '../table-model';

interface ConditionEditorProps extends Omit<StackProps, 'onChange'> {
  condition: Condition;
  onChange: (condition: Condition) => void;
}

function ConditionEditor({ condition, onChange, ...props }: ConditionEditorProps): ReactElement | null {
  if (condition.kind === 'Value') {
    return (
      <Stack gap={1} direction="row" {...props}>
        <TextField
          label="Value"
          placeholder="Exact value"
          value={condition.spec?.value ?? ''}
          onChange={(e) => onChange({ ...condition, spec: { value: e.target.value } } as Condition)}
          fullWidth
        />
      </Stack>
    );
  } else if (condition.kind === 'Range') {
    return (
      <Stack gap={1} direction="row" {...props}>
        <TextField
          label="From"
          placeholder="Start of range"
          value={condition.spec?.min ?? ''}
          onChange={(e) => onChange({ ...condition, spec: { ...condition.spec, min: +e.target.value } } as Condition)}
          fullWidth
        />
        <TextField
          label="To"
          placeholder="End of range (inclusive)"
          value={condition.spec?.max ?? ''}
          onChange={(e) => onChange({ ...condition, spec: { ...condition.spec, max: +e.target.value } } as Condition)}
          fullWidth
        />
      </Stack>
    );
  } else if (condition.kind === 'Regex') {
    return (
      <Stack gap={1} direction="row" {...props}>
        <TextField
          label="Regular Expression"
          placeholder="JavaScript regular expression"
          value={condition.spec?.expr ?? ''}
          onChange={(e) => onChange({ ...condition, spec: { expr: e.target.value } } as Condition)}
          fullWidth
        />
      </Stack>
    );
  } else if (condition.kind === 'Misc') {
    return (
      <Stack gap={1} direction="row" {...props}>
        <TextField
          select
          label="Value"
          value={condition.spec?.value ?? ''}
          onChange={(e) => onChange({ ...condition, spec: { value: e.target.value } } as Condition)}
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
  }
  return null;
}

export interface CellEditorProps extends Omit<GridProps, 'onChange'> {
  cell: CellSettings;
  onChange: (cell: CellSettings) => void;
  onDelete: () => void;
}

export function CellEditor({ cell, onChange, onDelete, ...props }: CellEditorProps): ReactElement {
  return (
    <Grid container spacing={2} {...props}>
      <Grid size={{ xs: 5 }}>
        <Stack direction="row" gap={1} width="100%">
          <TextField
            select
            label="Type"
            value={cell.condition.kind}
            onChange={(e) => onChange({ ...cell, condition: { kind: e.target.value } } as CellSettings)}
            required
            sx={{ width: '120px' }}
          >
            <MenuItem value="Value">
              <Stack>
                <Typography>Value</Typography>
                {cell.condition.kind !== 'Value' && (
                  <Typography variant="caption">Matches an exact text value</Typography>
                )}
              </Stack>
            </MenuItem>
            <MenuItem value="Range">
              <Stack>
                <Typography>Range</Typography>
                {cell.condition.kind !== 'Range' && (
                  <Typography variant="caption">Matches against a numerical range</Typography>
                )}
              </Stack>
            </MenuItem>
            <MenuItem value="Regex">
              <Stack>
                <Typography>Regex</Typography>
                {cell.condition.kind !== 'Regex' && (
                  <Typography variant="caption">Matches against a regular expression</Typography>
                )}
              </Stack>
            </MenuItem>
            <MenuItem value="Misc">
              <Stack>
                <Typography>Misc</Typography>
                {cell.condition.kind !== 'Misc' && (
                  <Typography variant="caption">Matches against empty, null and NaN values</Typography>
                )}
              </Stack>
            </MenuItem>
          </TextField>
          <ConditionEditor
            width="100%"
            condition={cell.condition}
            onChange={(updatedCondition) => onChange({ ...cell, condition: updatedCondition })}
          />
        </Stack>
      </Grid>
      <Grid size={{ xs: 4 }}>
        <TextField
          label="Display text"
          value={cell.text}
          onChange={(e) => onChange({ ...cell, text: e.target.value })}
          fullWidth
        />
      </Grid>
      <Grid size={{ xs: 1 }}>
        <Stack direction="row" justifyContent="center" gap={1}>
          {cell.textColor ? (
            <OptionsColorPicker
              label="Text Color"
              color={cell.textColor ?? '#000'}
              onColorChange={(color) => onChange({ ...cell, textColor: color } as CellSettings)}
              onClear={() => onChange({ ...cell, textColor: undefined } as CellSettings)}
            />
          ) : (
            <IconButton onClick={() => onChange({ ...cell, textColor: '#000' })}>
              <PlusIcon />
            </IconButton>
          )}
        </Stack>
      </Grid>
      <Grid size={{ xs: 1 }}>
        <Stack direction="row" justifyContent="center">
          {cell.backgroundColor ? (
            <OptionsColorPicker
              label="Background Color"
              color={cell.backgroundColor ?? '#fff'}
              onColorChange={(color) => onChange({ ...cell, backgroundColor: color } as CellSettings)}
              onClear={() => onChange({ ...cell, backgroundColor: undefined } as CellSettings)}
            />
          ) : (
            <IconButton onClick={() => onChange({ ...cell, backgroundColor: '#000' })}>
              <PlusIcon />
            </IconButton>
          )}
        </Stack>
      </Grid>
      <Grid size={{ xs: 1 }} textAlign="end">
        <Tooltip title="Remove cell settings" placement="top">
          <IconButton size="small" sx={{ marginLeft: 'auto' }} onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>
  );
}
