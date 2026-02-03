// Copyright 2025 The Perses Authors
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

import { Grid, Typography } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { DataQueriesProvider, PanelSpecEditor, usePlugin, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { Definition, PanelDefinition, PanelEditorValues, QueryDefinition, UnknownSpec } from '@perses-dev/core';
import { Control } from 'react-hook-form';
import { ReactElement, useContext } from 'react';
import { PanelEditorContext } from '../../context';
import { PanelPreview } from './PanelPreview';

export interface PanelQueriesSharedControlsProps {
  control: Control<PanelEditorValues>;
  plugin: Definition<UnknownSpec>;
  panelDefinition: PanelDefinition;
  onQueriesChange: (queries: QueryDefinition[]) => void;
  onPluginSpecChange: (spec: UnknownSpec) => void;
  onJSONChange: (panelDefinitionStr: string) => void;
}

// Component of PanelEditor, it will share queries results to its children with DataQueriesProvider.
// TODO: consider merging PanelEditorProvider, QueryCountProvider and DataQueriesProvider into a single provider to avoid multiple nested providers.
export function PanelQueriesSharedControls({
  plugin,
  control,
  panelDefinition,
  onQueriesChange,
  onPluginSpecChange,
  onJSONChange,
}: PanelQueriesSharedControlsProps): ReactElement {
  const { data: pluginPreview } = usePlugin('Panel', plugin.kind);
  const panelEditorContext = useContext(PanelEditorContext);

  const pluginQueryOptions =
    typeof pluginPreview?.queryOptions === 'function'
      ? pluginPreview?.queryOptions(panelDefinition.spec.plugin.spec)
      : pluginPreview?.queryOptions;

  const suggestedStepMs = useSuggestedStepMs(panelEditorContext?.preview.previewPanelWidth);

  const definitions =
    panelDefinition.spec.queries?.map((query) => {
      return {
        kind: query.spec.plugin.kind,
        spec: query.spec.plugin.spec,
        hidden: query.spec.hidden ?? false, // LOGZ.IO CHANGE:: APPZ-955-math-on-queries-formulas
      };
    }) ?? [];

  return (
    <DataQueriesProvider definitions={definitions} options={{ suggestedStepMs, ...pluginQueryOptions }}>
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
            control={control}
            panelDefinition={panelDefinition}
            onJSONChange={onJSONChange}
            onQueriesChange={onQueriesChange}
            onPluginSpecChange={onPluginSpecChange}
          />
        </ErrorBoundary>
      </Grid>
    </DataQueriesProvider>
  );
}
