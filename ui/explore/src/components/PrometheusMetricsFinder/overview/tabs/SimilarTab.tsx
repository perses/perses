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

import { DatasourceSelector } from '@perses-dev/core';
import { CircularProgress, Stack, StackProps } from '@mui/material';
import { ReactElement, useMemo } from 'react';
import { MetricList } from '../../display/list/MetricList';
import { LabelFilter } from '../../types';
import { useLabelValues } from '../../utils';

export interface SimilarTabProps extends StackProps {
  filters: LabelFilter[];
  datasource: DatasourceSelector;
  isMetadataEnabled?: boolean;
  onExplore: (metricName: string) => void;
}

export function SimilarTab({
  filters,
  datasource,
  isMetadataEnabled,
  onExplore,
  ...props
}: SimilarTabProps): ReactElement {
  const filtersWithoutName: LabelFilter[] = useMemo(() => {
    return filters.filter((filter) => filter.label !== '__name__');
  }, [filters]);
  const { data, isLoading } = useLabelValues('__name__', filtersWithoutName, datasource);

  if (isLoading) {
    return (
      <Stack width="100%" sx={{ alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <MetricList
      metricNames={data?.data ?? []}
      datasource={datasource}
      filters={filtersWithoutName}
      isMetadataEnabled={isMetadataEnabled}
      onExplore={onExplore}
      {...props}
    />
  );
}
