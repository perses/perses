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

import { Stack, StackProps } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { DEFAULT_PROM } from '@perses-dev/prometheus-plugin';
import { useMemo, useState } from 'react';
import * as React from 'react';
import { LabelFilter } from './types';
import { FinderFilters } from './filter/FinderFilters';
import { MetricGrid } from './display/grid/MetricGrid';

export interface MetricNameExplorerProps extends StackProps {
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  showPanelByDefault?: boolean;
}

export function MetricNameExplorer({ datasource, filters, showPanelByDefault, ...props }: MetricNameExplorerProps) {
  return <MetricGrid datasource={datasource} filters={filters} showPanelByDefault={showPanelByDefault} {...props} />;
}

export interface PrometheusMetricsFinderProps extends StackProps {
  hidePanelByDefault?: boolean;
}

export function PrometheusMetricsFinder({ hidePanelByDefault, ...props }: PrometheusMetricsFinderProps) {
  const [datasource, setDatasource] = useState<DatasourceSelector>(DEFAULT_PROM); // TODO: retrieve from context
  const [filters, setFilters] = useState<LabelFilter[]>([]);

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
    <Stack {...props}>
      <FinderFilters
        datasource={datasource}
        filters={filters}
        filteredFilters={filteredFilters}
        onDatasourceChange={setDatasource}
        onFiltersChange={setFilters}
      />
      <MetricNameExplorer datasource={datasource} filters={filteredFilters} showPanelByDefault={!hidePanelByDefault} />
    </Stack>
  );
}
