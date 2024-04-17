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

import React, { Fragment, HTMLAttributes } from 'react';
import { Checkbox, Divider, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { Controller, useFieldArray } from 'react-hook-form';
import PlusIcon from 'mdi-material-ui/Plus';
import MinusIcon from 'mdi-material-ui/Minus';

// TODO: react hook form deps

interface LinksEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  //onChange: (next: Link[]) => void;
}

export function LinksEditor({ ...props }: LinksEditorProps) {
  const { fields, append, remove } = useFieldArray({
    name: 'links', // unique name for your Field Array
  });

  return (
    <Stack {...props} gap={3}>
      {fields && fields.length > 0 ? (
        fields.map((field, index) => (
          <Fragment key={field.id}>
            <Stack direction="row" gap={1} alignItems="center">
              <LinkControl index={index} />
              <IconButton style={{ width: 'fit-content', height: 'fit-content' }} onClick={() => remove(index)}>
                <MinusIcon />
              </IconButton>
            </Stack>
            <Divider />
          </Fragment>
        ))
      ) : (
        <Typography variant="subtitle1" mb={2} fontStyle="italic">
          No links defined
        </Typography>
      )}
      <IconButton style={{ width: 'fit-content', height: 'fit-content' }} onClick={() => append({ url: '' })}>
        <PlusIcon />
      </IconButton>
    </Stack>
  );
}

function LinkControl({ index }: { index: number }) {
  return (
    <Stack gap={2} flexGrow={1}>
      <Stack direction="row" gap={2}>
        <Controller
          name={`links.${index}.url`}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              required
              fullWidth
              label="URL"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            />
          )}
        />
        <Controller
          name={`links.${index}.name`}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label="Name"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            />
          )}
        />
        <Controller
          name={`links.${index}.tooltip`}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label="Tooltip"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              onChange={(event) => {
                field.onChange(event);
              }}
            />
          )}
        />
        <Controller
          name={`links.${index}.icon`}
          render={({ field, fieldState }) => (
            <TextField
              select
              {...field}
              required
              label="Icon"
              type="text"
              fullWidth
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            >
              {[
                'external-link', // TODO: refactor
                'dashboard-link',
                'info-link',
                'question-link',
                'danger-link',
                'bolt-link',
                'download-link',
                'settings-link',
              ].map((option) => {
                return (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                );
              })}
            </TextField>
          )}
        />
      </Stack>
      <Stack gap={2} direction="row">
        <Controller
          name={`links.${index}.renderVariables`}
          render={({ field }) => (
            <FormControlLabel
              label="Render Variables"
              control={<Checkbox {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
            />
          )}
        />
        <Controller
          name={`links.${index}.targetBlank`}
          render={({ field }) => (
            <FormControlLabel
              label="Open in new tab"
              control={<Checkbox {...field} checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
            />
          )}
        />
      </Stack>
    </Stack>
  );
}
