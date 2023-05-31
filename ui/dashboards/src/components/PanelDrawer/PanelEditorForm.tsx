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

import { useEffect, useState } from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { PanelDefinition } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PanelSpecEditor, usePluginEditor } from '@perses-dev/plugin-system';
import { useListPanelGroups } from '../../context';
import { PanelEditorValues } from '../../context/DashboardProvider/panel-editor-slice';
import { PanelPreview } from './PanelPreview';
import { usePanelEditor } from './usePanelEditor';

export interface PanelEditorFormProps {
  initialValues: PanelEditorValues;
  onChange: (values: PanelEditorValues) => void;
}

export function PanelEditorForm(props: PanelEditorFormProps) {
  const {
    initialValues: { panelDefinition: initialPanelDef, groupId: initialGroupId },
    onChange,
  } = props;

  const { panelDefinition, setName, setDescription, setQueries, setPlugin, setPanelDefinition } =
    usePanelEditor(initialPanelDef);
  const [groupId, setGroupId] = useState(initialGroupId);
  const groups = useListPanelGroups();
  const { plugin } = panelDefinition.spec;

  // Use common plugin editor logic even though we've split the inputs up in this form
  const pluginEditor = usePluginEditor({
    pluginType: 'Panel',
    value: { kind: plugin.kind, spec: plugin.spec },
    onChange: (plugin) => {
      setPlugin(plugin);
    },
    onHideQueryEditorChange: (isHidden) => {
      setQueries(undefined, isHidden);
    },
  });

  const handleNameChange = (name: string) => {
    setName(name);
  };

  const handleDescriptionChange = (description: string) => {
    setDescription(description);
  };

  const handleGroupIdChange = (groupId: number) => {
    setGroupId(groupId);
  };

  const handlePanelDefinitionChange = (nextPanelDef: PanelDefinition) => {
    const { kind: pluginKind, spec: pluginSpec } = nextPanelDef.spec.plugin;
    // if panel plugin kind and spec are modified, then need to save current spec
    if (
      panelDefinition.spec.plugin.kind !== pluginKind &&
      JSON.stringify(panelDefinition.spec.plugin.spec) !== JSON.stringify(pluginSpec)
    ) {
      pluginEditor.rememberCurrentSpecState();
    }

    setPanelDefinition(nextPanelDef);
  };

  useEffect(() => {
    const values: PanelEditorValues = { panelDefinition, groupId };
    onChange(values);
  }, [panelDefinition, groupId, onChange]);

  return (
    // Grid maxHeight allows user to scroll inside Drawer to see all content
    <Box
      component="form"
      id={panelEditorFormId}
      sx={{ flex: 1, overflowY: 'scroll', padding: (theme) => theme.spacing(2) }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h4" marginBottom={1}>
            Preview
          </Typography>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelPreview panelDefinition={panelDefinition} />
          </ErrorBoundary>
        </Grid>
        <Grid item xs={12}>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelSpecEditor
              panelDefinition={panelDefinition}
              groupId={groupId}
              groups={groups}
              pluginEditor={pluginEditor}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
              onGroupIdChange={handleGroupIdChange}
              onQueriesChange={(queries) => {
                setQueries(queries);
              }}
              onPluginSpecChange={(spec) => {
                pluginEditor.onSpecChange(spec);
              }}
              onJSONChange={handlePanelDefinitionChange}
            />
          </ErrorBoundary>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * The `id` attribute added to the `PanelEditorForm` component, allowing submit buttons to live outside the form.
 */
export const panelEditorFormId = 'panel-editor-form';
