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

import { DataQueriesProvider, MultiQueryEditor, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { ScatterChart } from '@perses-dev/panels-plugin';
import { TracingGanttChart } from '@perses-dev/jaeger-ui-plugin';
import { QueryDefinition } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import useResizeObserver from 'use-resize-observer';
import { PANEL_PREVIEW_DEFAULT_WIDTH, PANEL_PREVIEW_HEIGHT } from './constants';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

function TracePanel({ queries }: { queries: QueryDefinition[] }) {
  const { width, ref: boxRef } = useResizeObserver();
  const height = PANEL_PREVIEW_HEIGHT;
  const suggestedStepMs = useSuggestedStepMs(width);

  // map TraceQueryDefinition to Definition<UnknownSpec>
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
        <ScatterChart.PanelComponent
          contentDimensions={{ width: width ?? PANEL_PREVIEW_DEFAULT_WIDTH, height }}
          spec={{}}
        />
      </DataQueriesProvider>
    </Box>
  );
}

function GanttPanel({ queries }: { queries: QueryDefinition[] }) {
  const { width, ref: boxRef } = useResizeObserver();
  const height = 400;
  const suggestedStepMs = useSuggestedStepMs(width);

  // map TraceQueryDefinition to Definition<UnknownSpec>
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
        <TracingGanttChart.PanelComponent
          contentDimensions={{ width: width ?? PANEL_PREVIEW_DEFAULT_WIDTH, height }}
          spec={{}}
        />
      </DataQueriesProvider>
    </Box>
  );
}

export function TracesExplorer() {
  const { tab, queries, setTab, setQueries } = useExplorerManagerContext();

  return (
    <Stack gap={2} sx={{ width: '100%' }}>
      <MultiQueryEditor queryTypes={['TraceQuery']} onChange={setQueries} queries={queries} />

      <Tabs
        value={tab}
        onChange={(_, state) => setTab(state)}
        variant="scrollable"
        sx={{ borderRight: 1, borderColor: 'divider' }}
      >
        <Tab label="Graph" />
        <Tab label="Gantt" />
      </Tabs>
      <Stack gap={1}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          {tab === 0 && <TracePanel queries={queries} />}
          {tab === 1 && <GanttPanel queries={queries} />}
        </ErrorBoundary>
      </Stack>
    </Stack>
  );
}
