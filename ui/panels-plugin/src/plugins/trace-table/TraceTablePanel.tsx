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

import { PanelProps, useDataQueries } from '@perses-dev/plugin-system';
import { Box } from '@mui/material';
import { LoadingOverlay, NoDataOverlay, useChartsTheme } from '@perses-dev/components';
import { QueryDefinition } from '@perses-dev/core';
import { ReactElement } from 'react';
import { DataTable, TraceLink } from './DataTable';
import { TraceTableOptions } from './trace-table-model';

export interface TraceTablePanelProps extends PanelProps<TraceTableOptions> {
  /**
   * Specify a link for the traces in the table.
   * If this field is unset or undefined, a link to the Gantt chart on the explore page is configured.
   * Set this field explicitly to null to disable creating a link.
   */
  traceLink?: TraceLink | null;
}

export function defaultTraceLink({
  query: originalQuery,
  traceId,
}: {
  query: QueryDefinition;
  traceId: string;
}): string {
  // clone the original query spec (including the datasource) and replace the query value with the trace id
  const query: QueryDefinition = JSON.parse(JSON.stringify(originalQuery));
  query.spec.plugin.spec.query = traceId;

  const traceLinkParams = new URLSearchParams({
    explorer: 'traces',
    data: JSON.stringify({ queries: [query] }),
  });

  return `/explore?${traceLinkParams}`;
}

export function TraceTablePanel(props: TraceTablePanelProps): ReactElement {
  const { spec, traceLink } = props;

  const chartsTheme = useChartsTheme();
  const { isFetching, isLoading, queryResults } = useDataQueries('TraceQuery');
  const contentPadding = chartsTheme.container.padding.default;

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

  return (
    <Box sx={{ height: '100%', padding: `${contentPadding}px`, overflowY: 'auto' }}>
      <DataTable
        options={spec}
        result={queryResults}
        traceLink={traceLink === null ? undefined : (traceLink ?? defaultTraceLink)}
      />
    </Box>
  );
}
