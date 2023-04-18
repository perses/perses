// Copyright 2023 The Perses Authors
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

import { FormControl, FormLabel, FormControlLabelProps, Stack, Box, IconButton } from '@mui/material';
import React from 'react';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import { useId } from '../utils';
import { InfoTooltip } from '../InfoTooltip';

export type OptionsEditorControlProps = Pick<FormControlLabelProps, 'label' | 'control'> & {
  description?: string;
};

export const OptionsEditorControl = ({ label, control, description }: OptionsEditorControlProps) => {
  // Make sure we have a unique ID we can use for associating labels and
  // controls for a11y.
  const generatedControlId = useId('EditorSectionControl');
  const controlId = `${generatedControlId}-control`;

  const controlProps = {
    id: controlId,
  };

  return (
    <FormControl>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" justifyContent="center">
          <FormLabel htmlFor={controlId}>{label}</FormLabel>
          {description && (
            <InfoTooltip description={description} enterDelay={100}>
              <IconButton
                size="small"
                sx={(theme) => ({ borderRadius: theme.shape.borderRadius, padding: '4x', margin: '0 2px' })}
              >
                <InformationOutlineIcon
                  aria-describedby="info-tooltip"
                  aria-hidden={false}
                  fontSize="inherit"
                  sx={{ color: (theme) => theme.palette.grey[700] }}
                />
              </IconButton>
            </InfoTooltip>
          )}
        </Stack>
        <Box sx={{ width: '150px', textAlign: 'right' }}> {React.cloneElement(control, controlProps)}</Box>
      </Stack>
    </FormControl>
  );
};
