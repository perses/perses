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

import { DataQueriesProvider, MultiQueryEditor, useDataQueries } from '@perses-dev/plugin-system';
import { Box, Stack } from '@mui/material';
import { ErrorAlert, ErrorBoundary, LoadingOverlay, NoDataOverlay } from '@perses-dev/components';
import { Panel } from '@perses-dev/dashboards';
import { QueryDefinition, isValidTraceId } from '@perses-dev/core';
import { PANEL_PREVIEW_HEIGHT, PANEL_PREVIEW_TRACES_SCATTERPLOT_HEIGHT } from './constants';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

function SearchResultsPanel({ queries }: { queries: QueryDefinition[] }) {
  const { isFetching, isLoading, queryResults } = useDataQueries('TraceQuery');

  if (isLoading || isFetching) {
    return <LoadingOverlay />;
  }

  // no query executed, show empty panel
  if (queryResults.length === 0) {
    return <></>;
  }

  const tracesFound = queryResults.some((traceData) => (traceData.data?.searchResult ?? []).length > 0);
  if (!tracesFound) {
    return <NoDataOverlay resource="traces" />;
  }

  return (
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
  );
}

function GanttChartPanel({ queries }: { queries: QueryDefinition[] }) {
  return (
    <Panel
      panelOptions={{
        hideHeader: true,
      }}
      definition={{
        kind: 'Panel',
        spec: { queries, display: { name: '' }, plugin: { kind: 'GanttChart', spec: {} } },
      }}
    />
  );
}

export function TracesExplorer() {
  const { queries, setQueries } = useExplorerManagerContext();

  // map TraceQueryDefinition to Definition<UnknownSpec>
  const definitions = queries.length
    ? queries.map((query) => {
        return {
          kind: query.spec.plugin.kind,
          spec: query.spec.plugin.spec,
        };
      })
    : [];

  // TODO: how to access query string here?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isSingleTrace = definitions.length === 1 && isValidTraceId((definitions[0]?.spec as any).query || '');

  return (
    <Stack gap={2} sx={{ width: '100%' }}>
      <MultiQueryEditor queryTypes={['TraceQuery']} onChange={setQueries} queries={queries} />

      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <DataQueriesProvider definitions={definitions}>
          <Box height={PANEL_PREVIEW_HEIGHT}>
            {isSingleTrace ? <GanttChartPanel queries={queries} /> : <SearchResultsPanel queries={queries} />}
          </Box>
        </DataQueriesProvider>
      </ErrorBoundary>
    </Stack>
  );
}
