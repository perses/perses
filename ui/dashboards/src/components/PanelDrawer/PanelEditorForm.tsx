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
import { Grid, FormControl, InputLabel, Select, MenuItem, TextField, SelectProps } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { useLayouts } from '../../context';
import { PanelEditorState } from '../../context/DashboardProvider/panel-editing';
import { PanelEditorFormValues, usePanelSpecState } from './panel-editor-model';
import { PanelTypeSelect } from './PanelTypeSelect';
import { PanelSpecEditor } from './PanelSpecEditor';

export interface PanelEditorFormProps {
  initialDefinition: PanelEditorState['initialDefinition'];
  initialGroup: PanelEditorState['initialGroup'];
  onSubmit: (values: PanelEditorFormValues) => void;
}

export function PanelEditorForm(props: PanelEditorFormProps) {
  const { initialDefinition, initialGroup, onSubmit } = props;

  const { layouts } = useLayouts();

  const [name, setName] = useState(initialDefinition.spec.display.name);
  const [description, setDescription] = useState(initialDefinition.spec.display.name ?? '');
  const [group, setGroup] = useState(initialGroup);
  const [kind, setKind] = useState(initialDefinition.spec.plugin.kind);
  const { spec, onSpecChange } = usePanelSpecState(kind, initialDefinition.spec.plugin.spec);

  // Ignore string values (which would be an "empty" value from the Select) since we don't allow them to unset it
  const handleGroupChange: SelectProps<number>['onChange'] = (e) => {
    const { value } = e.target;
    if (typeof value === 'string') {
      return;
    }
    setGroup(value);
  };

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const values: PanelEditorFormValues = { name, description, group, kind, spec };
    onSubmit(values);
  };

  return (
    <form id={panelEditorFormId} onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <TextField
            required
            label="Panel Name"
            value={name}
            variant="outlined"
            onChange={(e) => setName(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <FormControl>
            <InputLabel id="select-group">Group</InputLabel>
            <Select required labelId="select-group" label="Group" value={group ?? 0} onChange={handleGroupChange}>
              {layouts.map((layout, index) => (
                <MenuItem key={index} value={index}>
                  {layout.spec.display?.title ?? `Group ${index + 1}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={8}>
          <TextField
            label="Panel Description"
            value={description}
            variant="outlined"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <FormControl>
            <InputLabel id="panel-type-label">Panel Type</InputLabel>
            <PanelTypeSelect
              required
              labelId="panel-type-label"
              label="Panel Type"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            {/* Wait until we have some proper initial spec values before rendering the editor */}
            {spec !== undefined && <PanelSpecEditor panelPluginKind={kind} value={spec} onChange={onSpecChange} />}
          </ErrorBoundary>
        </Grid>
      </Grid>
    </form>
  );
}

/**
 * The `id` attribute added to the `PanelEditorForm` component, allowing submit buttons to live outside the form.
 */
export const panelEditorFormId = 'panel-editor-form';
