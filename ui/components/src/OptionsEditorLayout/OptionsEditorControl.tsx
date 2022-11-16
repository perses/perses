// Copyright 2022 The Perses Authors
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

import { FormControl, FormLabel, FormControlLabelProps, Stack, Box } from '@mui/material';
import React from 'react';
import { useId } from '../utils';

export type OptionsEditorControlProps = Pick<FormControlLabelProps, 'label' | 'control'>;

export const OptionsEditorControl = ({ label, control }: OptionsEditorControlProps) => {
  // Make sure we have an ID we can use for associating labels and controls for
  // a11y
  const generatedControlId = useId('EditorSectionControl');
  const controlId = `${generatedControlId}-control`;

  const controlProps = {
    id: controlId,
  };

  return (
    <FormControl>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <FormLabel htmlFor={controlId}>{label}</FormLabel>
        <Box sx={{ width: '160px', textAlign: 'right' }}> {React.cloneElement(control, controlProps)}</Box>
      </Stack>
    </FormControl>
  );
};
