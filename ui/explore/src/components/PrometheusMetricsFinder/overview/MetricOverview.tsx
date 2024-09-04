import { Stack, StackProps, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { DatasourceSelector } from '@perses-dev/core';
import { Panel } from '@perses-dev/dashboards';
import * as React from 'react';
import useResizeObserver from 'use-resize-observer';
import { DataQueriesProvider, useSuggestedStepMs } from '@perses-dev/plugin-system';

import { computeFilterExpr, LabelFilter } from '../types';
import { OverviewTab } from './tabs/OverviewTab';

export interface MetricOverviewProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  onExplore: (metricName: string) => void;
}

export function MetricOverview({ metricName, datasource, filters, ...props }: MetricOverviewProps) {
  const [tab, setTab] = useState(0);
  const { width, ref: panelRef } = useResizeObserver();
  const suggestedStepMs = useSuggestedStepMs(width);

  const filtersWithMetricName: LabelFilter[] = useMemo(() => {
    const result = filters.filter((filter) => filter.label !== '__name__');
    result.push({ label: '__name__', labelValues: [metricName], operator: '=' });
    return result;
  }, [filters, metricName]);

  const queries = [
    {
      kind: 'TimeSeriesQuery',
      spec: {
        plugin: {
          kind: 'PrometheusTimeSeriesQuery',
          spec: {
            datasource: datasource,
            query: `{__name__="${metricName}", ${computeFilterExpr(filtersWithMetricName)}}`,
          },
        },
      },
    },
  ];

  const definitions = queries.map((query) => {
    return {
      kind: query.spec.plugin.kind,
      spec: query.spec.plugin.spec,
    };
  });

  return (
    <Stack sx={{ width: '100%' }} {...props}>
      <Stack ref={panelRef} height="250px">
        <DataQueriesProvider definitions={definitions} options={{ suggestedStepMs, mode: 'range' }}>
          <Panel
            panelOptions={{
              hideHeader: true,
            }}
            definition={{
              kind: 'Panel',
              spec: {
                queries: queries,
                display: { name: '' },
                plugin: { kind: 'TimeSeriesChart', spec: {} },
              },
            }}
          />
        </DataQueriesProvider>
      </Stack>
      <Tabs
        value={tab}
        onChange={(_, state) => setTab(state)}
        variant="scrollable"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Overview" />
        <Tab label="Labels" />
        <Tab label="Job related metrics" />
        <Tab label="Filter related metrics" />
      </Tabs>
      <Stack gap={1}>
        {tab === 0 && <OverviewTab metricName={metricName} datasource={datasource} filters={filtersWithMetricName} />}
        {tab === 1 && <Stack></Stack>}
        {tab === 2 && <Stack></Stack>}
        {tab === 3 && <Stack></Stack>}
      </Stack>
    </Stack>
  );
}
