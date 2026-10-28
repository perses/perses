// Copyright The Perses Authors
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

import { Box } from '@mui/material';
import { Panel } from '@perses-dev/dashboards';
import {
  DataQueriesProvider,
  useAllVariableValues,
  useDatasourceStore,
  usePlugin,
  useTimeRange,
} from '@perses-dev/plugin-system';
import type { PanelDefinition, QueryDefinition } from '@perses-dev/spec';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

const LOGS_TABLE_HEIGHT = 700;
const HISTOGRAM_HEIGHT = 200;
const PANEL_OPTIONS = { hideHeader: true };

function buildVolumePanel(queries: QueryDefinition[]): PanelDefinition {
  return {
    kind: 'Panel',
    spec: {
      queries,
      display: { name: 'Log Volume' },
      plugin: {
        kind: 'TimeSeriesChart',
        spec: {
          legend: { position: 'bottom', mode: 'list' },
          visual: { display: 'bar', stack: 'all' },
          yAxis: { label: 'Logs per second' },
        },
      },
    },
  };
}

function buildLogsTablePanel(queries: QueryDefinition[]): PanelDefinition {
  return { kind: 'Panel', spec: { queries, display: { name: '' }, plugin: { kind: 'LogsTable', spec: {} } } };
}

export interface LogResultsProps {
  query: QueryDefinition;
}

/** Log volume histogram, when the query plugin supports it, and the logs table of a log query. */
export function LogResults(props: LogResultsProps): ReactElement {
  const { query } = props;
  const { data: queryPlugin } = usePlugin('LogQuery', query.spec.plugin.kind);
  const { absoluteTimeRange } = useTimeRange();
  const datasourceStore = useDatasourceStore();
  const variableState = useAllVariableValues();

  const queries = useMemo(() => [query], [query]);
  const logsTablePanel = useMemo(() => buildLogsTablePanel(queries), [queries]);
  const volumeQueries = useMemo(() => {
    const volumeQuery = queryPlugin?.createVolumeQuery?.(query.spec.plugin.spec, {
      timeRange: absoluteTimeRange,
      variableState,
      datasourceStore,
      refreshKey: '',
    });
    return volumeQuery ? [volumeQuery] : [];
  }, [queryPlugin, query, absoluteTimeRange, variableState, datasourceStore]);
  const volumePanel = useMemo(() => buildVolumePanel(volumeQueries), [volumeQueries]);

  return (
    <>
      {volumeQueries.length > 0 && (
        <Box height={HISTOGRAM_HEIGHT}>
          <DataQueriesProvider definitions={volumeQueries}>
            <Panel panelOptions={PANEL_OPTIONS} definition={volumePanel} />
          </DataQueriesProvider>
        </Box>
      )}
      <Box height={LOGS_TABLE_HEIGHT}>
        <DataQueriesProvider definitions={queries}>
          <Panel panelOptions={PANEL_OPTIONS} definition={logsTablePanel} />
        </DataQueriesProvider>
      </Box>
    </>
  );
}
