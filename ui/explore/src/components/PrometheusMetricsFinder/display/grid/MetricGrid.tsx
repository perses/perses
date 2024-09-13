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

import { Stack, StackProps, useMediaQuery, useTheme } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { LabelFilter } from '../../types';
import { MetricCard } from './MetricCard';

export interface MetricGridProps extends StackProps {
  metricNames: string[];
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  isMetadataEnabled?: boolean;
  isPanelEnabled?: boolean;
  onExplore: (metricName: string) => void;
}

export function MetricGrid({
  metricNames,
  datasource,
  filters,
  isMetadataEnabled,
  isPanelEnabled,
  onExplore,
  ...props
}: MetricGridProps) {
  const isMobileSize = useMediaQuery(useTheme().breakpoints.down('md'));

  // Formatting data to be displayed in a row of a table with 4 cells
  const formattedData: string[][] = useMemo(() => {
    const result = [];

    for (let i = 0; i < (metricNames.length ?? 0); i += 4) {
      result.push(metricNames.slice(i, i + 4));
    }

    return result;
  }, [metricNames]);

  return (
    <Stack {...props}>
      <Virtuoso
        style={{ height: '70vh', width: '100%' }}
        data={formattedData}
        itemContent={(_, row) => (
          <Stack direction={isMobileSize ? 'column' : 'row'} gap={isMobileSize ? 0.5 : 2}>
            {row.map((key) => (
              <MetricCard
                key={key}
                metricName={key}
                datasource={datasource}
                filters={filters}
                height="250px"
                isMetadataEnabled={isMetadataEnabled}
                isPanelEnabled={isPanelEnabled}
                sx={{ mt: 2 }}
                onExplore={onExplore}
              >
                {key}
              </MetricCard>
            ))}
          </Stack>
        )}
      />
    </Stack>
  );
}
