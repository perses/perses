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
import { Button, Divider, Skeleton, Stack, StackProps, TableCell, Typography } from '@mui/material';
import { TableVirtuoso } from 'react-virtuoso';
import { Link as RouterLink } from 'react-router-dom';
import CompassIcon from 'mdi-material-ui/Compass';
import React, { ReactNode, useMemo } from 'react';
import { Fuzzy, FuzzyMatchingInterval } from '@nexucis/fuzzy';
import { LabelFilter } from '../../types';
import { useMetricMetadata } from '../../utils';
import { useExplorerQueryParams } from '../../../ExploreManager/query-params';
import { MetricChip } from '../MetricChip';

export interface MetricRowProps {
  children?: ReactNode;
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  isMetadataEnabled?: boolean;
  onExplore?: (metricName: string) => void;
}

export function MetricRow({ children, metricName, datasource, filters, isMetadataEnabled, onExplore }: MetricRowProps) {
  const { metadata, isLoading } = useMetricMetadata(metricName, datasource, isMetadataEnabled);

  const searchParams = useExplorerQueryParams({
    data: { tab: 'finder', datasource, filters, exploredMetric: metricName },
  });

  return (
    <>
      <TableCell style={{ width: '300px' }}>
        <Typography sx={{ fontFamily: 'monospace' }}>{children ?? metricName}</Typography>
      </TableCell>

      <TableCell style={{ width: 115, textAlign: 'center' }}>
        {isMetadataEnabled && isLoading ? (
          <Skeleton variant="rounded" width={75} />
        ) : (
          <MetricChip label={metadata?.type ?? 'unknown'} />
        )}
      </TableCell>
      <TableCell style={{ width: '100%' }}>
        {isMetadataEnabled && isLoading ? (
          <Skeleton variant="text" width={180} />
        ) : (
          <Typography sx={{ fontStyle: metadata?.help ? 'initial' : 'italic', minWidth: '30vw' }}>
            {metadata ? metadata.help : 'unknown'}
          </Typography>
        )}
      </TableCell>
      <TableCell style={{ width: 140 }}>
        <Button
          aria-label={`explore metric ${metricName}`}
          variant="contained"
          startIcon={<CompassIcon />}
          style={{ textWrap: 'nowrap' }}
          onClick={() => onExplore?.(metricName)}
          component={RouterLink}
          to={`?${searchParams}`}
        >
          Explore
        </Button>
      </TableCell>
    </>
  );
}

export interface MetricListProps extends StackProps {
  metricNames: string[];
  filteredResults?: Array<{ original: string; intervals?: FuzzyMatchingInterval[] }>;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  isMetadataEnabled?: boolean;
  onExplore?: (metricName: string) => void;
}

export function MetricList({
  metricNames,
  filteredResults,
  datasource,
  filters,
  isMetadataEnabled,
  onExplore,
  ...props
}: MetricListProps) {
  const fuzzy = new Fuzzy();

  const fuzzyMetrics: Array<{ original: string; intervals?: FuzzyMatchingInterval[] }> = useMemo(() => {
    if (filteredResults) {
      return filteredResults;
    }
    return metricNames.map((metricName) => ({ original: metricName }));
  }, [filteredResults, metricNames]);

  return (
    <Stack gap={2} width="100%" divider={<Divider orientation="horizontal" flexItem />} {...props}>
      <TableVirtuoso
        style={{ height: '70vh', width: '100%' }}
        totalCount={fuzzyMetrics.length}
        itemContent={(index) => (
          <MetricRow
            metricName={fuzzyMetrics[index]!.original}
            datasource={datasource}
            filters={filters}
            isMetadataEnabled={isMetadataEnabled}
            onExplore={onExplore}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: fuzzy.render(fuzzyMetrics[index]!.original, fuzzyMetrics[index]!.intervals ?? [], {
                  pre: '<strong style="color:darkorange">',
                  post: '</strong>',
                  escapeHTML: true,
                }),
              }}
            />
          </MetricRow>
        )}
      />
      <Stack sx={{ width: '100%' }} textAlign="end">
        <Typography data-testid="finder-total">
          Total: <strong>{metricNames.length}</strong> metrics
        </Typography>
      </Stack>
    </Stack>
  );
}
