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
import { Button, Chip, ChipProps, Divider, Skeleton, Stack, StackProps, TableCell, Typography } from '@mui/material';
import { TableVirtuoso } from 'react-virtuoso';
import { Link as RouterLink } from 'react-router-dom';
import CompassIcon from 'mdi-material-ui/Compass';
import { LabelFilter } from '../../types';
import { useMetricMetadata } from '../../utils';
import { useExplorerQueryParams } from '../../../ExploreManager/query-params';

export function MetricChip({ label, ...props }: ChipProps) {
  if (label === 'gauge') {
    return <Chip label={label} color="success" {...props} />;
  }
  if (label === 'counter') {
    return <Chip label={label} color="primary" {...props} />;
  }
  if (label === 'histogram') {
    return <Chip label={label} color="warning" {...props} />;
  }
  if (label === 'summary') {
    return <Chip label={label} color="info" {...props} />;
  }

  return <Chip label={label} sx={{ fontStyle: label === 'unknown' ? 'italic' : 'initial' }} {...props} />;
}

export interface MetricRowProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  isMetadataEnabled?: boolean;
  onExplore?: (metricName: string) => void;
}

export function MetricRow({ metricName, datasource, filters, isMetadataEnabled, onExplore }: MetricRowProps) {
  const { metadata, isLoading } = useMetricMetadata(metricName, datasource, isMetadataEnabled);

  const searchParams = useExplorerQueryParams({
    data: { tab: 'finder', datasource, filters, exploredMetric: metricName },
  });

  return (
    <>
      <TableCell style={{ width: '300px' }}>
        <Typography sx={{ fontFamily: 'monospace' }}>{metricName}</Typography>
      </TableCell>

      <TableCell style={{ minWidth: 'fit-content', textAlign: 'center' }}>
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
          <Typography sx={{ fontStyle: metadata?.help ? 'initial' : 'italic' }}>
            {metadata ? metadata.help : 'unknown'}
          </Typography>
        )}
      </TableCell>
      <TableCell style={{ minWidth: 'fit-content' }}>
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
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  isMetadataEnabled?: boolean;
  onExplore?: (metricName: string) => void;
}

export function MetricList({
  metricNames,
  datasource,
  filters,
  isMetadataEnabled,
  onExplore,
  ...props
}: MetricListProps) {
  return (
    <Stack gap={2} width="100%" divider={<Divider orientation="horizontal" flexItem />} {...props}>
      <TableVirtuoso
        style={{ height: '70vh', width: '100%' }}
        data={metricNames}
        itemContent={(_, metricName) => (
          <MetricRow
            metricName={metricName}
            datasource={datasource}
            filters={filters}
            isMetadataEnabled={isMetadataEnabled}
            onExplore={onExplore}
          />
        )}
      />
      <Stack sx={{ width: '100%' }} textAlign="end">
        <Typography>
          Total: <strong>{metricNames.length}</strong> metrics
        </Typography>
      </Stack>
    </Stack>
  );
}
