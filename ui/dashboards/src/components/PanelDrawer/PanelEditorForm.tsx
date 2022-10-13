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
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectProps,
  TextField,
  Typography,
} from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PluginKindSelect, PluginSpecEditor, usePluginEditor } from '@perses-dev/plugin-system';
import { useListPanelGroups } from '../../context';
import { PanelEditorValues } from '../../context/DashboardProvider/panel-editing-slice';
import { PanelPreview } from './PanelPreview';

export interface PanelEditorFormProps {
  initialValues: PanelEditorValues;
  onSubmit: (values: PanelEditorValues) => void;
}

export function PanelEditorForm(props: PanelEditorFormProps) {
  const { initialValues, onSubmit } = props;

  const panelGroups = useListPanelGroups();

  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [groupId, setGroupId] = useState(initialValues.groupId);
  const [kind, setKind] = useState(initialValues.kind);
  const [spec, setSpec] = useState(initialValues.spec);

  // Use common plugin editor logic even though we've split the inputs up in this form
  const pluginEditor = usePluginEditor({
    pluginType: 'Panel',
    value: { kind, spec },
    onChange: (plugin) => {
      setKind(plugin.kind);
      setSpec(plugin.spec);
    },
  });

  // Ignore string values (which would be an "empty" value from the Select) since we don't allow them to unset it
  const handleGroupChange: SelectProps<number>['onChange'] = (e) => {
    const { value } = e.target;
    if (typeof value === 'string') {
      return;
    }
    setGroupId(value);
  };

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    const values: PanelEditorValues = { name, description, groupId, kind, spec };
    onSubmit(values);
  };

  return (
    <form id={panelEditorFormId} onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <TextField required label="Name" value={name} variant="outlined" onChange={(e) => setName(e.target.value)} />
        </Grid>
        <Grid item xs={4}>
          <FormControl>
            <InputLabel id="select-group">Group</InputLabel>
            <Select required labelId="select-group" label="Group" value={groupId} onChange={handleGroupChange}>
              {panelGroups.map((panelGroup, index) => (
                <MenuItem key={panelGroup.id} value={panelGroup.id}>
                  {panelGroup.title ?? `Group ${index + 1}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={8}>
          <TextField
            label="Description"
            value={description}
            variant="outlined"
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid>
        <Grid item xs={4}>
          <FormControl disabled={pluginEditor.isLoading} error={pluginEditor.error !== null}>
            <InputLabel id="panel-type-label">Type</InputLabel>
            <PluginKindSelect
              pluginType="Panel"
              required
              labelId="panel-type-label"
              label="Type"
              value={pluginEditor.pendingKind ? pluginEditor.pendingKind : kind}
              onChange={pluginEditor.onKindChange}
            />
          </FormControl>
          <FormHelperText>{pluginEditor.error?.message ?? ''}</FormHelperText>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h4" marginBottom={1}>
            Preview
          </Typography>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelPreview kind={kind} name={name} description={description} spec={spec} groupId={groupId} />
          </ErrorBoundary>
        </Grid>
        <Grid item xs={12}>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PluginSpecEditor pluginType="Panel" pluginKind={kind} value={spec} onChange={pluginEditor.onSpecChange} />
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
