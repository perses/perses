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
import { DEFAULT_PROM } from '@perses-dev/prometheus-plugin';
import { PrometheusMetricsFinder } from '../PrometheusMetricsFinder';
import { FinderQueryParams } from '../PrometheusMetricsFinder/types';
import { PANEL_PREVIEW_HEIGHT } from './constants';
import { useExplorerManagerContext } from './ExplorerManagerProvider';

interface MetricsExplorerQueryParams extends FinderQueryParams {
  tab?: string;
  queries?: QueryDefinition[];
}

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
  const definitions = queries.map((query) => {
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
  const {
    data: { tab = 'table', queries = [], datasource = DEFAULT_PROM, filters = [], exploredMetric = undefined },
    setData,
  } = useExplorerManagerContext<MetricsExplorerQueryParams>();

  return (
    <Stack gap={2} sx={{ width: '100%' }}>
      <Tabs
        value={tab}
        onChange={(_, state) => setData({ tab: state, queries })}
        variant="scrollable"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="table" label="Table" />
        <Tab value="graph" label="Graph" />
        <Tab value="finder" label="Finder" />
      </Tabs>
      <Stack gap={1}>
        {tab === 'table' && (
          <Stack>
            <MultiQueryEditor
              queryTypes={['TimeSeriesQuery']}
              onChange={(state) => setData({ tab, queries: state })}
              queries={queries}
            />
            <MetricDataTable queries={queries} />
          </Stack>
        )}
        {tab === 'graph' && (
          <Stack>
            <MultiQueryEditor
              queryTypes={['TimeSeriesQuery']}
              onChange={(state) => setData({ tab, queries: state })}
              queries={queries}
            />
            <TimeSeriesPanel queries={queries} />
          </Stack>
        )}
        {tab === 'finder' && (
          <Stack>
            <PrometheusMetricsFinder
              onChange={(state) => setData({ tab, ...state })}
              value={{ datasource, filters, exploredMetric }}
            />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
