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
import { PanelEditorFormValues } from './panel-editor-form-model';
import { PanelTypeSelect, PanelTypeSelectProps } from './PanelTypeSelect';
import { PanelSpecEditor } from './PanelSpecEditor';

export interface PanelEditorFormProps {
  initialValues: PanelEditorFormValues;
  onSubmit: (values: PanelEditorFormValues) => void;
}

export function PanelEditorForm(props: PanelEditorFormProps) {
  const { initialValues, onSubmit } = props;

  const { layouts } = useLayouts();

  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [group, setGroup] = useState(initialValues.group);
  const [kind, setKind] = useState(initialValues.kind);
  const [spec, setSpec] = useState(initialValues.spec);

  // Ignore string values (which would be an "empty" value from the Select) since we don't allow them to unset it
  const handleGroupChange: SelectProps<number>['onChange'] = (e) => {
    const { value } = e.target;
    if (typeof value === 'string') {
      return;
    }
    setGroup(value);
  };

  const handleKindChange: PanelTypeSelectProps['onChange'] = (e) => {
    // TODO: Kind change flow?
    setKind(e.target.value);
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
              onChange={handleKindChange}
            />
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelSpecEditor panelPluginKind={kind} value={spec} onChange={setSpec} />
          </ErrorBoundary>
        </Grid>
      </Grid>
    </form>
  );
}

export const panelEditorFormId = 'panel-editor-form';
