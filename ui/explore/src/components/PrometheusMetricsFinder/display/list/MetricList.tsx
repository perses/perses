import { DatasourceSelector } from '@perses-dev/core';
import { Button, Chip, ChipProps, Divider, Grid2Props, Skeleton, Stack, TableCell, Typography } from '@mui/material';
import { TableVirtuoso } from 'react-virtuoso';
import * as React from 'react';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import {
  MetricMetadata,
  MetricMetadataRequestParameters,
  MetricMetadataResponse,
  PrometheusClient,
} from '@perses-dev/prometheus-plugin';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import EyeOutlineIcon from 'mdi-material-ui/EyeOutline';
import { LabelFilter } from '../../types';

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
  onExplore: (metricName: string) => void;
}

export function MetricRow({ metricName, datasource, onExplore }: MetricRowProps) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data, isLoading } = useQuery<MetricMetadataResponse>({
    enabled: !!client,
    queryKey: ['metricMetadata', metricName],
    queryFn: async () => {
      const params: MetricMetadataRequestParameters = { metric: metricName };

      return await client!.metricMetadata(params);
    },
  });

  const metadata: MetricMetadata | undefined = useMemo(() => {
    return data?.data?.[metricName]?.[0];
  }, [data, metricName]);

  return (
    <>
      <TableCell style={{ width: '300px' }}>
        <Typography sx={{ fontFamily: 'monospace' }}>{metricName}</Typography>
      </TableCell>

      <TableCell style={{ minWidth: 'fit-content' }}>
        {isLoading ? <Skeleton variant="rounded" width={50} /> : <MetricChip label={metadata?.type ?? 'unknown'} />}
      </TableCell>
      <TableCell style={{ width: '100%' }}>
        {isLoading ? (
          <Skeleton variant="rounded" width={180} />
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
          startIcon={<EyeOutlineIcon />}
          style={{ textWrap: 'nowrap' }}
          onClick={() => onExplore(metricName)}
        >
          Explore
        </Button>
      </TableCell>
    </>
  );
}

export interface MetricListProps extends Grid2Props {
  metricNames: string[];
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  onExplore: (metricName: string) => void;
}

export function MetricList({ metricNames, datasource, filters, onExplore, ...props }: MetricListProps) {
  return (
    <Stack gap={2} width="100%" divider={<Divider orientation="horizontal" flexItem />} {...props}>
      <TableVirtuoso
        style={{ height: '70vh', width: '100%' }}
        data={metricNames}
        itemContent={(_, metricName) => (
          <MetricRow metricName={metricName} datasource={datasource} filters={filters} onExplore={onExplore} />
        )}
      />
    </Stack>
  );
}
