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

import { DataQueriesProvider, MultiQueryEditor } from '@perses-dev/plugin-system';
import { Box, Stack, Tab, Tabs } from '@mui/material';
import { QueryDefinition } from '@perses-dev/core';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { Panel } from '@perses-dev/dashboards';
import { PANEL_PREVIEW_HEIGHT, PANEL_PREVIEW_TRACES_SCATTERPLOT_HEIGHT } from './constants';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

function TracePanel({ queries }: { queries: QueryDefinition[] }) {
  const height = PANEL_PREVIEW_HEIGHT;

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
    <Box height={height}>
      <DataQueriesProvider definitions={definitions}>
        <Stack height="100%">
          <Box height={PANEL_PREVIEW_TRACES_SCATTERPLOT_HEIGHT}>
            <Panel
              panelOptions={{
                hideHeader: true,
              }}
              definition={{
                kind: 'Panel',
                spec: { queries, display: { name: '' }, plugin: { kind: 'ScatterChart', spec: {} } },
              }}
            />
          </Box>
          <Panel
            sx={{ flexGrow: 1, marginTop: '15px' }}
            panelOptions={{
              hideHeader: true,
            }}
            definition={{
              kind: 'Panel',
              spec: { queries, display: { name: '' }, plugin: { kind: 'TraceTable', spec: {} } },
            }}
          />
        </Stack>
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
        <Tab label="Table" />
      </Tabs>
      <Stack gap={1}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>{tab === 0 && <TracePanel queries={queries} />}</ErrorBoundary>
      </Stack>
    </Stack>
  );
}
