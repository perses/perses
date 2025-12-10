// Copyright 2025 The Perses Authors
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

import { Checkbox, FormControlLabel, Stack } from '@mui/material';
import { ReactElement } from 'react';
import { TextField } from '../controls';

export interface LinkEditorFormField<T> {
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  label: string;
  error: { hasError?: boolean; helperText?: string };
}

export interface LinkEditorFormProps {
  mode: 'inline' | 'modalEmbedded';
  url: LinkEditorFormField<string>;
  name?: Omit<LinkEditorFormField<string>, 'error'>;
  tooltip?: Omit<LinkEditorFormField<string>, 'error'>;
  newTabOpen: Omit<LinkEditorFormField<boolean>, 'error'>;
  renderVariables?: Omit<LinkEditorFormField<boolean>, 'error'>;
}

export const LinkEditorForm = (props: LinkEditorFormProps): ReactElement => {
  const { mode, url, name, newTabOpen, renderVariables, tooltip } = props;

  return (
    <Stack direction="column" gap={2} flexGrow={1}>
      <TextField
        label={url.label}
        error={url.error?.hasError}
        helperText={url.error?.helperText}
        onChange={url.onChange}
        placeholder={url.placeholder}
        multiline
        maxRows={5}
        required
        fullWidth
        value={url.value}
      />
      {(name || tooltip) && (
        <Stack gap={1} direction={mode === 'inline' ? 'row' : 'column'}>
          {name && (
            <TextField
              sx={{ flexGrow: '1' }}
              label={name.label}
              onChange={name?.onChange}
              placeholder={name?.placeholder}
              value={name?.value}
            />
          )}
          {tooltip && (
            <TextField
              sx={{ flexGrow: '1' }}
              label={tooltip.label}
              onChange={tooltip?.onChange}
              placeholder={tooltip?.placeholder}
              value={tooltip?.value}
            />
          )}
        </Stack>
      )}
      <Stack direction="row" gap={1}>
        {renderVariables && (
          <FormControlLabel
            label={renderVariables.label}
            control={
              <Checkbox
                checked={renderVariables.value}
                onChange={(e) => {
                  renderVariables?.onChange(e.target.checked);
                }}
              />
            }
          />
        )}

        <FormControlLabel
          label={newTabOpen.label}
          control={
            <Checkbox
              checked={newTabOpen.value}
              onChange={(e) => {
                newTabOpen?.onChange(e.target.checked);
              }}
            />
          }
        />
      </Stack>
    </Stack>
  );
};
