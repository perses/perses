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

import { DataQueriesProvider, TimeSeriesQueryEditor, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { QueryDefinition } from '@perses-dev/core';
import React, { useRef, useState } from 'react';
import { TimeSeriesChart } from '@perses-dev/panels-plugin';
import { ExploreToolbar } from '../ExploreToolbar';

export interface TimeseriesExplorerProps {
  exploreTitleComponent?: React.ReactNode;
}

const PANEL_PREVIEW_HEIGHT = 300;
const PANEL_PREVIEW_DEFAULT_WIDTH = 840;

export interface PanelPreviewValues {
  queries: QueryDefinition[];
}

export function TimeSeriesPanel({ queries }: PanelPreviewValues) {
  const boxRef = useRef<HTMLDivElement>(null);
  let width = PANEL_PREVIEW_DEFAULT_WIDTH;
  if (boxRef.current !== null) {
    width = boxRef.current.getBoundingClientRect().width;
  }
  const suggestedStepMs = useSuggestedStepMs(width);

  // map TimeSeriesQueryDefinition to Definition<UnknownSpec>
  const definitions = queries.length
    ? queries.map((query) => {
        return {
          kind: query.spec.plugin.kind,
          spec: query.spec.plugin.spec,
        };
      })
    : [];

  return (
    <Box ref={boxRef} height={PANEL_PREVIEW_HEIGHT}>
      <DataQueriesProvider definitions={definitions} options={{ suggestedStepMs }}>
        <TimeSeriesChart.PanelComponent
          contentDimensions={{
            width,
            height: PANEL_PREVIEW_HEIGHT,
          }}
          spec={{}}
        />
      </DataQueriesProvider>
    </Box>
  );
}

export function TimeSeriesExplorer(props: TimeseriesExplorerProps) {
  const { exploreTitleComponent } = props;

  const [queries, setQueries] = useState<QueryDefinition[]>();

  return (
    <Stack sx={{ width: '100%' }} px={2} pb={2} pt={1.5} gap={2}>
      <ExploreToolbar exploreTitleComponent={exploreTitleComponent} />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Stack gap={1}>
            <TimeSeriesQueryEditor onChange={setQueries} queries={queries} />
          </Stack>
        </Grid>
        <Grid item xs={12}>
          <Stack gap={1}>
            <Typography variant="h4">Preview</Typography>
            <ErrorBoundary FallbackComponent={ErrorAlert}>
              <TimeSeriesPanel queries={queries ?? []} />
            </ErrorBoundary>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
