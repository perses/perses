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

import { QueryDefinition } from '@perses-dev/core';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { DataQueriesProvider, MultiQueryEditor, useSuggestedStepMs } from '@perses-dev/plugin-system';
import useResizeObserver from 'use-resize-observer';
import { Panel } from '@perses-dev/dashboards';
import { PANEL_PREVIEW_HEIGHT } from './constants';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

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
      <DataQueriesProvider definitions={definitions} options={{ suggestedStepMs, mode: 'range' }}>
        <Panel
          panelOptions={{
            hideHeader: true,
          }}
          definition={{
            kind: 'Panel',
            spec: { queries: queries, display: { name: '' }, plugin: { kind: 'TimeSeriesChart', spec: {} } },
          }}
        />
      </DataQueriesProvider>
    </Box>
  );
}

function MetricDataTable({ queries }: { queries: QueryDefinition[] }) {
  const height = PANEL_PREVIEW_HEIGHT;

  // map TimeSeriesQueryDefinition to Definition<UnknownSpec>
  const definitions = (queries ?? []).map((query) => {
    return {
      kind: query.spec.plugin.kind,
      spec: query.spec.plugin.spec,
    };
  });

  return (
    <Box height={height}>
      <DataQueriesProvider definitions={definitions} options={{ mode: 'instant' }}>
        <Panel
          panelOptions={{
            hideHeader: true,
          }}
          definition={{
            kind: 'Panel',
            spec: { queries: queries, display: { name: '' }, plugin: { kind: 'TimeSeriesTable', spec: {} } },
          }}
        />
      </DataQueriesProvider>
    </Box>
  );
}

export function MetricsExplorer() {
  const { tab, queries, setTab, setQueries } = useExplorerManagerContext();

  return (
    <Stack gap={2} sx={{ width: '100%' }}>
      <MultiQueryEditor queryTypes={['TimeSeriesQuery']} onChange={setQueries} queries={queries} />

      <Tabs
        value={tab}
        onChange={(_, state) => setTab(state)}
        variant="scrollable"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Table" />
        <Tab label="Graph" />
      </Tabs>
      <Stack gap={1}>
        {tab === 0 && <MetricDataTable queries={queries} />}
        {tab === 1 && <TimeSeriesPanel queries={queries} />}
      </Stack>
    </Stack>
  );
}
