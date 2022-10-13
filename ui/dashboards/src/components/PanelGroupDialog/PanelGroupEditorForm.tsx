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

import { FormEventHandler, useState } from 'react';
import { FormControl, InputLabel, TextField, Select, SelectProps, MenuItem } from '@mui/material';
import { PanelGroupEditorValues } from '../../context';

type CollapsedState = 'Open' | 'Closed';

export interface PanelGroupEditorFormProps {
  initialValues: PanelGroupEditorValues;
  onSubmit: (next: PanelGroupEditorValues) => void;
}

export function PanelGroupEditorForm(props: PanelGroupEditorFormProps) {
  const { initialValues, onSubmit } = props;

  const [title, setTitle] = useState(initialValues.title);
  const [isCollapsed, setIsCollapsed] = useState(initialValues.isCollapsed);

  const handleCollapsedChange: SelectProps<CollapsedState>['onChange'] = (e) => {
    const next = e.target.value;
    setIsCollapsed(next === 'Closed');
  };

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    onSubmit({ title, isCollapsed });
  };

  return (
    <form id={panelGroupEditorFormId} onSubmit={handleSubmit}>
      <FormControl margin="normal">
        <TextField required label="Name" variant="outlined" value={title} onChange={(e) => setTitle(e.target.value)} />
      </FormControl>
      <FormControl margin="normal">
        <InputLabel id="select-collapse-state">Collapse State</InputLabel>
        <Select<CollapsedState>
          required
          displayEmpty
          labelId="select-collapse-state"
          label="Collapse State"
          size="small"
          value={isCollapsed ? 'Closed' : 'Open'}
          onChange={handleCollapsedChange}
        >
          <MenuItem value="Open">Open</MenuItem>
          <MenuItem value="Closed">Closed</MenuItem>
        </Select>
      </FormControl>
    </form>
  );
}

/**
 * The `id` attribute added to the `PanelGroupEditorForm` component, allowing submit buttons to live outside the form.
 */
export const panelGroupEditorFormId = 'panel-group-editor-form';
