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

import { FormEventHandler, ReactElement, useState } from 'react';
import { FormControl, TextField, MenuItem } from '@mui/material';
import { PanelGroupEditorValues } from '../../context';

export interface PanelGroupEditorFormProps {
  initialValues: PanelGroupEditorValues;
  variables?: string[];
  onSubmit: (next: PanelGroupEditorValues) => void;
}

export function PanelGroupEditorForm(props: PanelGroupEditorFormProps): ReactElement {
  const { initialValues, variables, onSubmit } = props;

  const [title, setTitle] = useState(initialValues.title);
  const [isCollapsed, setIsCollapsed] = useState(initialValues.isCollapsed);
  const [repeatVariable, setRepeatVariable] = useState(initialValues.repeatVariable);

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    onSubmit({ title, isCollapsed, repeatVariable });
  };

  return (
    <form id={panelGroupEditorFormId} onSubmit={handleSubmit}>
      <FormControl fullWidth margin="normal">
        <TextField
          required
          label="Name"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="panel-group-editor-name"
        />
      </FormControl>
      <FormControl fullWidth margin="normal">
        <TextField
          select
          required
          label="Collapse State"
          size="small"
          value={isCollapsed ? 'Closed' : 'Open'}
          onChange={(e) => setIsCollapsed(e.target.value === 'Closed')}
        >
          <MenuItem value="Open">Open</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
        </TextField>
        <FormControl fullWidth margin="normal">
          <TextField
            select
            required
            label="Repeated Variable"
            variant="outlined"
            value={repeatVariable}
            onChange={(e) => setRepeatVariable(e.target.value)}
          >
            {variables?.map((variable) => (
              <MenuItem key={variable} value={variable}>
                {variable}
              </MenuItem>
            ))}
          </TextField>
        </FormControl>
      </FormControl>
    </form>
  );
}

/**
 * The `id` attribute added to the `PanelGroupEditorForm` component, allowing submit buttons to live outside the form.
 */
export const panelGroupEditorFormId = 'panel-group-editor-form';
