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

import { Button, ButtonGroup, ButtonGroupProps, CircularProgress, Stack, StackProps } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { DEFAULT_PROM } from '@perses-dev/prometheus-plugin';
import { useMemo } from 'react';
import * as React from 'react';
import ViewListIcon from 'mdi-material-ui/ViewList';
import GridIcon from 'mdi-material-ui/Grid';
import ArrowLeftIcon from 'mdi-material-ui/ArrowLeft';
import { DisplayMode, LabelFilter } from './types';
import { FinderFilters } from './filter/FinderFilters';
import { MetricGrid } from './display/grid/MetricGrid';
import { MetricList } from './display/list/MetricList';
import { MetricOverview } from './overview/MetricOverview';
import { useLabelValues } from './utils';

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
  const { data, isLoading } = useLabelValues('__name__', filters, datasource);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

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

export interface PrometheusMetricsFinderProps extends Omit<StackProps, 'onChange'> {
  hidePanelByDefault?: boolean;
  value: {
    display: DisplayMode;
    datasource: DatasourceSelector;
    filters: LabelFilter[];
    exploredMetric: string | undefined;
  };
  onChange: ({
    display,
    datasource,
    filters,
    exploredMetric,
  }: {
    display: DisplayMode;
    datasource: DatasourceSelector;
    filters: LabelFilter[];
    exploredMetric: string | undefined;
  }) => void;
}

export function PrometheusMetricsFinder({
  hidePanelByDefault,
  value: { display = 'list', datasource = DEFAULT_PROM, filters = [], exploredMetric },
  onChange,
  ...props
}: PrometheusMetricsFinderProps) {
  function setDisplay(value: DisplayMode) {
    onChange({ display: value, datasource, filters, exploredMetric });
  }

  function setDatasource(value: DatasourceSelector) {
    onChange({ display, datasource: value, filters, exploredMetric });
  }

  function setFilters(value: LabelFilter[]) {
    onChange({ display, datasource, filters: value, exploredMetric });
  }

  function setExploredMetric(value: string | undefined) {
    onChange({ display, datasource, filters, exploredMetric: value });
  }

  // Remove duplicated filters and filters without label or labelValues
  const filteredFilters: LabelFilter[] = useMemo(() => {
    const usableFilters: Map<string, Set<string>> = new Map();

    for (const filter of filters ?? []) {
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
          datasource={datasource ?? DEFAULT_PROM}
          filters={filters ?? []}
          filteredFilters={filteredFilters}
          onDatasourceChange={setDatasource}
          onFiltersChange={setFilters}
        />
        <Stack direction="row" gap={1} alignItems="center">
          {exploredMetric ? (
            <Button
              variant="contained"
              aria-label="back to metric explorer"
              startIcon={<ArrowLeftIcon />}
              onClick={() => setExploredMetric(undefined)}
            >
              Back
            </Button>
          ) : (
            <ToggleDisplayButtons value={display ?? 'list'} onChange={setDisplay} sx={{ height: 32 }} />
          )}
        </Stack>
      </Stack>
      {exploredMetric ? (
        <MetricOverview
          metricName={exploredMetric}
          datasource={datasource ?? DEFAULT_PROM}
          filters={filteredFilters}
          onExplore={setExploredMetric}
          onFiltersChange={setFilters}
        />
      ) : (
        <MetricNameExplorer
          datasource={datasource ?? DEFAULT_PROM}
          filters={filteredFilters}
          showPanelByDefault={false}
          display={display ?? 'list'}
          onExplore={setExploredMetric}
        />
      )}
    </Stack>
  );
}

// TODO: theme colors
// TODO: others tab
// TODO: tests
// TODO: put virtualized autocomplete in components
// TODO: improve url query params
