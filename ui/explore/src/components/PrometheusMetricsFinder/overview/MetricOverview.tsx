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

import { Checkbox, FormControlLabel, Skeleton, Stack, StackProps, Tab, Tabs, Tooltip } from '@mui/material';
import { ReactElement, useMemo, useState } from 'react';
import { DatasourceSelector, Definition, QueryDefinition, UnknownSpec } from '@perses-dev/core';
import { Panel } from '@perses-dev/dashboards';
import useResizeObserver from 'use-resize-observer';
import { DataQueriesProvider, useSuggestedStepMs } from '@perses-dev/plugin-system';
import HelpCircleOutlineIcon from 'mdi-material-ui/HelpCircleOutline';
import { computeFilterExpr, LabelFilter } from '../types';
import { useMetricMetadata } from '../utils';
import { OverviewTab } from './tabs/OverviewTab';
import { JobTab } from './tabs/JobTab';
import { SimilarTab } from './tabs/SimilarTab';

export interface OverviewPanelProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  type?: string;
  isLoading?: boolean;
}

export function OverviewPanel({
  metricName,
  datasource,
  filters,
  type,
  isLoading,
  ...props
}: OverviewPanelProps): ReactElement {
  const { width, ref: panelRef } = useResizeObserver();
  const suggestedStepMs = useSuggestedStepMs(width);

  const [rateEnabled, setRateEnabled] = useState(true);

  const { queries, definitions }: { queries: QueryDefinition[]; definitions: Array<Definition<UnknownSpec>> } =
    useMemo(() => {
      const expr =
        type === 'counter' || (rateEnabled && (type === undefined || type === 'summary' || type === 'histogram'))
          ? `rate({__name__="${metricName}", ${computeFilterExpr(filters)}}[5m])`
          : `{__name__="${metricName}", ${computeFilterExpr(filters)}}`;

      const queries = [
        {
          kind: 'TimeSeriesQuery',
          spec: {
            plugin: {
              kind: 'PrometheusTimeSeriesQuery',
              spec: {
                datasource: datasource,
                query: expr,
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

      return { queries, definitions };
    }, [datasource, filters, metricName, rateEnabled, type]);

  if (isLoading) {
    return (
      <Stack {...props}>
        <Skeleton variant="rectangular" height="100%" />
      </Stack>
    );
  }

  return (
    <Stack ref={panelRef} alignItems="end" {...props}>
      {(type === undefined || type === 'summary' || type === 'histogram') && (
        <FormControlLabel
          control={<Checkbox size="small" />}
          label="Enable rate"
          checked={rateEnabled}
          onChange={(_, checked) => setRateEnabled(checked)}
        />
      )}
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
  );
}

export interface MetricOverviewProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  isMetadataEnabled?: boolean;
  isPanelEnabled?: boolean;
  onExplore?: (metricName: string) => void;
  onFiltersChange: (filters: LabelFilter[]) => void;
}

export function MetricOverview({
  metricName,
  datasource,
  filters,
  isMetadataEnabled,
  isPanelEnabled,
  onExplore,
  onFiltersChange,
  ...props
}: MetricOverviewProps): ReactElement {
  const [tab, setTab] = useState(0);
  const { metadata, isLoading: isMetadataLoading } = useMetricMetadata(metricName, datasource);

  const filtersWithMetricName: LabelFilter[] = useMemo(() => {
    const result = filters.filter((filter) => filter.label !== '__name__');
    result.push({ label: '__name__', labelValues: [metricName], operator: '=' });
    return result;
  }, [filters, metricName]);

  function handleFilterAdd(filter: LabelFilter): void {
    onFiltersChange([...filters, filter]);
  }

  function handleExplore(metricName: string, tab?: number): void {
    onExplore?.(metricName);
    if (tab !== undefined) {
      setTab(tab);
    }
  }

  return (
    <Stack sx={{ width: '100%' }} {...props}>
      {isPanelEnabled && (
        <OverviewPanel
          metricName={metricName}
          filters={filters}
          datasource={datasource}
          type={metadata?.type}
          height="250px"
          isLoading={isMetadataEnabled && isMetadataLoading}
        />
      )}
      <Tabs
        value={tab}
        onChange={(_, state) => setTab(state)}
        variant="scrollable"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Overview" />
        <Tab
          label="Job related metrics"
          icon={
            <Tooltip title="All metrics scraped from the same job" placement="top">
              <HelpCircleOutlineIcon />
            </Tooltip>
          }
          iconPosition="end"
        />
        {filters.length > 0 && (
          <Tab
            label="Similar metrics"
            icon={
              <Tooltip title="All metrics matching current filters" placement="top">
                <HelpCircleOutlineIcon />
              </Tooltip>
            }
            iconPosition="end"
          />
        )}
      </Tabs>
      <Stack gap={1}>
        {tab === 0 && (
          <OverviewTab
            metricName={metricName}
            datasource={datasource}
            filters={filtersWithMetricName}
            onFilterAdd={handleFilterAdd}
          />
        )}
        {tab === 1 && (
          <JobTab
            filters={filtersWithMetricName}
            datasource={datasource}
            isMetadataEnabled={isMetadataEnabled}
            onExplore={(metricName) => handleExplore(metricName, 0)}
          />
        )}
        {tab === 2 && (
          <SimilarTab
            filters={filtersWithMetricName}
            datasource={datasource}
            isMetadataEnabled={isMetadataEnabled}
            onExplore={(metricName) => handleExplore(metricName, 0)}
          />
        )}
      </Stack>
    </Stack>
  );
}
