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

import { PanelEditorValues, PanelPreview } from '@perses-dev/dashboards';
import { TimeSeriesQueryEditor, usePluginEditor } from '@perses-dev/plugin-system';
import { FormProvider, useForm } from 'react-hook-form';
import { Grid, Stack, Typography } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { Action, Definition, UnknownSpec } from '@perses-dev/core';
import React, { SetStateAction } from 'react';
import { ExploreToolbar } from '../ExploreToolbar';
import { usePanelEditor } from '../../context/usePanelEditor';

export interface PanelEditorProps {
  initialValues: PanelEditorValues;
  initialAction: Action;
  exploreTitleComponent?: React.ReactNode;
}

export function PanelEditorForm(props: PanelEditorProps) {
  const {
    exploreTitleComponent,
    initialValues: { panelDefinition: initialPanelDef },
  } = props;

  const { setQueries, setPlugin, panelDefinition } = usePanelEditor(initialPanelDef);
  const { plugin } = panelDefinition.spec;
  const queries = panelDefinition.spec.queries ?? [];

  // Use common plugin editor logic even though we've split the inputs up in this form
  const pluginEditor = usePluginEditor({
    pluginType: 'Panel',
    value: { kind: plugin.kind, spec: plugin.spec },
    onChange: (plugin: SetStateAction<Definition<UnknownSpec>>) => {
      setPlugin(plugin);
    },
    onHideQueryEditorChange: (isHidden: boolean | undefined) => {
      setQueries(undefined, isHidden);
    },
  });

  const form = useForm({
    mode: 'onBlur',
    defaultValues: {
      type: pluginEditor.pendingKind ? pluginEditor.pendingKind : plugin.kind,
    },
  });

  return (
    <Stack sx={{ width: '100%' }} px={2} pb={2} pt={1.5} gap={2}>
      <ExploreToolbar exploreTitleComponent={exploreTitleComponent} />
      <FormProvider {...form}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Stack gap={1}>
              {/* Maybe in the future we should have something like PanelSpecEditor as we have on the Dashboard System */}
              <TimeSeriesQueryEditor onChange={setQueries} queries={queries} />
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Stack gap={1}>
              <Typography variant="h4">Preview</Typography>
              <ErrorBoundary FallbackComponent={ErrorAlert}>
                <PanelPreview panelDefinition={panelDefinition} />
              </ErrorBoundary>
            </Stack>
          </Grid>
        </Grid>
      </FormProvider>
    </Stack>
  );
}
