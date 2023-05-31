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

import { FormControl, FormHelperText, Grid, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { PanelDefinition } from '@perses-dev/core';
import { PluginEditorState } from '../PluginEditor';
import { PluginKindSelect } from '../PluginKindSelect';

// TODO: Move PanelGroupDefintion to core and use PanelGroupDefinition
type Group = {
  id: number;
  title?: string;
};

export type GeneralSettingsEditorProps = {
  panelDefinition: PanelDefinition;
  groupId: number;
  groups: Group[];
  pluginEditor: PluginEditorState;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onGroupIdChange: (groupId: number) => void;
};

export const GeneralSettingsEditor = ({
  panelDefinition,
  groupId,
  groups,
  pluginEditor,
  onNameChange,
  onDescriptionChange,
  onGroupIdChange,
}: GeneralSettingsEditorProps) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          required
          fullWidth
          label="Name"
          value={panelDefinition.spec.display.name ?? ''}
          variant="outlined"
          onChange={(e) => {
            onNameChange(e.target.value);
          }}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Description"
          value={panelDefinition.spec.display.description ?? ''}
          variant="outlined"
          onChange={(e) => {
            onDescriptionChange(e.target.value);
          }}
        />
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth disabled={pluginEditor.isLoading} error={pluginEditor.error !== null}>
          <InputLabel id="panel-type-label">Type</InputLabel>
          <PluginKindSelect
            pluginType="Panel"
            required
            labelId="panel-type-label"
            label="Type"
            value={pluginEditor.pendingKind ? pluginEditor.pendingKind : panelDefinition.spec.plugin.kind}
            onChange={pluginEditor.onKindChange}
          />
        </FormControl>
        <FormHelperText>{pluginEditor.error?.message ?? ''}</FormHelperText>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth>
          <InputLabel id="select-group">Group</InputLabel>
          <Select
            required
            labelId="select-group"
            label="Group"
            value={groupId}
            onChange={(e) => {
              const { value } = e.target;
              // Ignore string values (which would be an "empty" value from the Select)
              // since we don't allow them to unset it
              if (typeof value === 'string') {
                return;
              }
              onGroupIdChange(value);
            }}
          >
            {groups.map((group, index) => (
              <MenuItem key={group.id} value={group.id}>
                {group.title ?? `Group ${index + 1}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};
