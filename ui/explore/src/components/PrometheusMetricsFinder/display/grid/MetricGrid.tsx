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
import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import * as React from 'react';
import { LabelFilter } from '../../types';
import { MetricCard } from './MetricCard';

export interface MetricGridProps extends StackProps {
  metricNames: string[];
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  showPanelByDefault?: boolean;
  onExplore: (metricName: string) => void;
}

export function MetricGrid({
  metricNames,
  datasource,
  filters,
  showPanelByDefault,
  onExplore,
  ...props
}: MetricGridProps) {
  // Formatting data to be displayed in a row of a table with 4 cells
  const formattedData: Array<{ col1?: string; col2?: string; col3?: string; col4?: string }> = useMemo(() => {
    const result = [];

    for (let i = 0; i < (metricNames.length ?? 0); i += 4) {
      result.push({
        col1: metricNames[i],
        col2: metricNames[i + 1] ? metricNames[i + 1] : undefined,
        col3: metricNames[i + 2] ? metricNames[i + 2] : undefined,
        col4: metricNames[i + 3] ? metricNames[i + 3] : undefined,
      });
    }

    return result;
  }, [metricNames]);

  return (
    <Virtuoso
      style={{ height: '70vh', width: '100%' }}
      data={formattedData}
      itemContent={(_, row) => (
        <Stack direction="row" gap={2} {...props}>
          {row.col1 && (
            <MetricCard
              metricName={row.col1}
              datasource={datasource}
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
              sx={{ mt: 2 }}
              onExplore={onExplore}
            >
              {row.col1}
            </MetricCard>
          )}
          {row.col2 && (
            <MetricCard
              metricName={row.col2}
              datasource={datasource}
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
              sx={{ mt: 2 }}
              onExplore={onExplore}
            >
              {row.col2}
            </MetricCard>
          )}
          {row.col3 && (
            <MetricCard
              metricName={row.col3}
              datasource={datasource}
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
              sx={{ mt: 2 }}
              onExplore={onExplore}
            >
              {row.col3}
            </MetricCard>
          )}
          {row.col4 && (
            <MetricCard
              metricName={row.col4}
              datasource={datasource}
              filters={filters}
              height="250px"
              showPanel={showPanelByDefault}
              sx={{ mt: 2 }}
              onExplore={onExplore}
            >
              {row.col4}
            </MetricCard>
          )}
        </Stack>
      )}
    />
  );
}