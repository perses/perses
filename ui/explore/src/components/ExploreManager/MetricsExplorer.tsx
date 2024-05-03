// Copyright 2024 The Perses Authors
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

import { useState } from 'react';
import { QueryDefinition } from '@perses-dev/core';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { DataQueriesProvider, MultiQueryEditor, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { TimeSeriesChart } from '@perses-dev/panels-plugin';
import useResizeObserver from 'use-resize-observer';
import { PANEL_PREVIEW_DEFAULT_WIDTH, PANEL_PREVIEW_HEIGHT } from './constants';

function TimeSeriesPanel({ queries }: { queries: QueryDefinition[] }) {
  const { width, ref: boxRef } = useResizeObserver();
  const height = PANEL_PREVIEW_HEIGHT;

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
    <Box ref={boxRef} height={height}>
      <DataQueriesProvider definitions={definitions} options={{ suggestedStepMs }}>
        <TimeSeriesChart.PanelComponent
          contentDimensions={{ width: width ?? PANEL_PREVIEW_DEFAULT_WIDTH, height }}
          spec={{}}
        />
      </DataQueriesProvider>
    </Box>
  );
}

export function MetricsExplorer() {
  const [queries, setQueries] = useState<QueryDefinition[]>();
  const [tabState, setTabState] = useState(0);
  return (
    <Stack gap={2} sx={{ width: '100%' }}>
      <MultiQueryEditor queryTypes={['TimeSeriesQuery']} onChange={setQueries} queries={queries} />

      <Tabs
        value={tabState}
        onChange={(_, state) => setTabState(state)}
        variant="scrollable"
        sx={{ borderRight: 1, borderColor: 'divider' }}
      >
        <Tab label="Graph" />
      </Tabs>
      <Stack gap={1}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          {tabState === 0 && <TimeSeriesPanel queries={queries ?? []} />}
        </ErrorBoundary>
      </Stack>
    </Stack>
  );
}
