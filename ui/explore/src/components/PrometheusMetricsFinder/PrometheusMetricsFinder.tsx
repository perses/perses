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

import { Button, ButtonGroup, ButtonGroupProps, Stack, StackProps } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import {
  DEFAULT_PROM,
  LabelValuesRequestParameters,
  LabelValuesResponse,
  PrometheusClient,
} from '@perses-dev/prometheus-plugin';
import { useMemo, useState } from 'react';
import * as React from 'react';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import { useQuery } from '@tanstack/react-query';
import ViewListIcon from 'mdi-material-ui/ViewList';
import GridIcon from 'mdi-material-ui/Grid';
import ArrowLeftIcon from 'mdi-material-ui/ArrowLeft';
import { computeFilterExpr, LabelFilter } from './types';
import { FinderFilters } from './filter/FinderFilters';
import { MetricGrid } from './display/grid/MetricGrid';
import { MetricList } from './display/list/MetricList';
import { MetricOverview } from './overview/MetricOverview';

type DisplayMode = 'grid' | 'list';

export interface ToggleDisplayButtonsProps extends Omit<ButtonGroupProps, 'onChange'> {
  value: DisplayMode;
  onChange: (value: DisplayMode) => void;
}

export function ToggleDisplayButtons({ value, onChange, ...props }: ToggleDisplayButtonsProps) {
  return (
    <ButtonGroup variant="contained" aria-label="change current metric finder display" disableElevation {...props}>
      <Button
        variant={value === 'grid' ? 'contained' : 'outlined'}
        startIcon={<GridIcon />}
        onClick={() => onChange('grid')}
      >
        Grid
      </Button>
      <Button
        variant={value === 'list' ? 'contained' : 'outlined'}
        startIcon={<ViewListIcon />}
        onClick={() => onChange('list')}
      >
        List
      </Button>
    </ButtonGroup>
  );
}

export interface MetricNameExplorerProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  display: DisplayMode;
  showPanelByDefault?: boolean;
  onExplore: (metricName: string) => void;
}

export function MetricNameExplorer({
  datasource,
  filters,
  display,
  showPanelByDefault,
  onExplore,
  ...props
}: MetricNameExplorerProps) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data } = useQuery<LabelValuesResponse>({
    enabled: !!client,
    queryKey: ['labelValues', '__name__', 'datasource', datasource.name, 'filters', filters],
    queryFn: async () => {
      const params: LabelValuesRequestParameters = { labelName: '__name__' };
      if (filters.length) {
        params['match[]'] = [`{${computeFilterExpr(filters)}}`];
      }

      return await client!.labelValues(params);
    },
  });

  if (display === 'list') {
    return (
      <MetricList
        metricNames={data?.data ?? []}
        datasource={datasource}
        filters={filters}
        onExplore={onExplore}
        {...props}
      />
    );
  }

  return (
    <MetricGrid
      metricNames={data?.data ?? []}
      datasource={datasource}
      filters={filters}
      showPanelByDefault={showPanelByDefault}
      onExplore={onExplore}
      {...props}
    />
  );
}

export interface PrometheusMetricsFinderProps extends StackProps {
  hidePanelByDefault?: boolean;
}

export function PrometheusMetricsFinder({ hidePanelByDefault, ...props }: PrometheusMetricsFinderProps) {
  const [display, setDisplay] = useState<DisplayMode>('list');
  const [datasource, setDatasource] = useState<DatasourceSelector>(DEFAULT_PROM); // TODO: retrieve from context
  const [filters, setFilters] = useState<LabelFilter[]>([]);
  const [exploredMetric, setExploredMetric] = useState<string | undefined>(undefined);

  // Remove duplicated filters and filters without label or labelValues
  const filteredFilters: LabelFilter[] = useMemo(() => {
    const usableFilters: Map<string, Set<string>> = new Map();

    for (const filter of filters) {
      // Ignore filters without a label or labelValues
      if (!filter.label || filter.labelValues.length === 0) {
        continue;
      }

      // Remove duplicated labelValues
      let labelValues = usableFilters.get(filter.label);
      if (!labelValues) {
        labelValues = new Set<string>();
        usableFilters.set(filter.label, labelValues);
      }
      for (const labelValue of filter.labelValues) {
        labelValues.add(labelValue);
      }
    }

    // Format the result
    const result: LabelFilter[] = [];
    for (const [label, labelValues] of usableFilters.entries()) {
      result.push({ label, labelValues: Array.from(labelValues) });
    }

    return result;
  }, [filters]);

  return (
    <Stack {...props} gap={1}>
      <Stack direction="row" gap={2} justifyContent="space-between">
        <FinderFilters
          datasource={datasource}
          filters={filters}
          filteredFilters={filteredFilters}
          onDatasourceChange={setDatasource}
          onFiltersChange={setFilters}
        />
        <Stack direction="row" gap={1}>
          {exploredMetric && (
            <Button
              variant="contained"
              aria-label="back to metric explorer"
              startIcon={<ArrowLeftIcon />}
              onClick={() => setExploredMetric(undefined)}
            >
              Back
            </Button>
          )}
          <ToggleDisplayButtons value={display} onChange={setDisplay} />
        </Stack>
      </Stack>
      {exploredMetric ? (
        <MetricOverview
          metricName={exploredMetric}
          datasource={datasource}
          filters={filteredFilters}
          onExplore={setExploredMetric}
        />
      ) : (
        <MetricNameExplorer
          datasource={datasource}
          filters={filteredFilters}
          showPanelByDefault={!hidePanelByDefault}
          display={display}
          onExplore={setExploredMetric}
        />
      )}
    </Stack>
  );
}
