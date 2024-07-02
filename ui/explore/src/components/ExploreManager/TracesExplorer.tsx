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
import { PANEL_PREVIEW_HEIGHT } from './constants';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

interface SearchResultsPanelProps {
  queries: QueryDefinition[];
  setQueries: (queries: QueryDefinition[]) => void;
}

function SearchResultsPanel({ queries, setQueries }: SearchResultsPanelProps) {
  const { isFetching, isLoading, queryResults } = useDataQueries('TraceQuery');

  // no query executed, show empty panel
  if (queryResults.length === 0) {
    return <></>;
  }

  if (isLoading || isFetching) {
    return <LoadingOverlay />;
  }

  const queryError = queryResults.find((d) => d.error);
  if (queryError) {
    throw queryError.error;
  }

  const tracesFound = queryResults.some((traceData) => (traceData.data?.searchResult ?? []).length > 0);
  if (!tracesFound) {
    return <NoDataOverlay resource="traces" />;
  }

  function onTraceClick(e: MouseEvent, traceId: string) {
    e.preventDefault();
    setQueries([{ kind: 'TraceQuery', spec: { plugin: { kind: 'TempoTraceQuery', spec: { query: traceId } } } }]);
  }

  return (
    <Stack sx={{ height: '100%' }} gap={2}>
      <Box sx={{ height: '35%', flexShrink: 0 }}>
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
        sx={{ flexGrow: 1 }}
        panelOptions={{
          hideHeader: true,
        }}
        definition={{
          kind: 'Panel',
          spec: { queries, display: { name: '' }, plugin: { kind: 'TraceTable', spec: { onTraceClick } } },
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

  // Cannot cast to TempoTraceQuerySpec because 'tempo-plugin' types are not accessible in @perses-dev/explore
  const isSingleTrace =
    queries.length === 1 &&
    queries[0]?.kind === 'TraceQuery' &&
    queries[0]?.spec.plugin.kind === 'TempoTraceQuery' &&
    isValidTraceId((queries[0]?.spec.plugin.spec as any).query ?? ''); // eslint-disable-line @typescript-eslint/no-explicit-any

  return (
    <Stack gap={2} sx={{ width: '100%' }}>
      <MultiQueryEditor queryTypes={['TraceQuery']} onChange={setQueries} queries={queries} />

      <ErrorBoundary FallbackComponent={ErrorAlert}>
        <DataQueriesProvider definitions={definitions}>
          <Box height={PANEL_PREVIEW_HEIGHT}>
            {isSingleTrace ? (
              <GanttChartPanel queries={queries} />
            ) : (
              <SearchResultsPanel queries={queries} setQueries={setQueries} />
            )}
          </Box>
        </DataQueriesProvider>
      </ErrorBoundary>
    </Stack>
  );
}
