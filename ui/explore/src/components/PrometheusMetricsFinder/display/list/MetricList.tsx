import { DatasourceSelector } from '@perses-dev/core';
import { Button, Chip, Divider, Grid2Props, Skeleton, Stack, TableCell, Typography } from '@mui/material';
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

export interface MetricRowProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
}

export function MetricRow({ metricName, datasource, filters }: MetricRowProps) {
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
        <Typography>{metricName}</Typography>
      </TableCell>

      <TableCell style={{ minWidth: 'fit-content' }}>
        {isLoading ? <Skeleton variant="rounded" width={50} /> : <Chip label={metadata ? metadata.type : 'unknown'} />}
      </TableCell>
      <TableCell style={{ width: '100%' }}>
        {isLoading ? (
          <Skeleton variant="rounded" width={180} />
        ) : (
          <Typography>{metadata ? metadata.help : 'unknown'}</Typography>
        )}
      </TableCell>
      <TableCell style={{ minWidth: 'fit-content' }}>
        <Button
          aria-label={`explore metric ${metricName}`}
          variant="contained"
          size="small"
          startIcon={<EyeOutlineIcon />}
          style={{ textWrap: 'nowrap' }}
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
}

export function MetricList({ metricNames, datasource, filters, ...props }: MetricListProps) {
  return (
    <Stack gap={2} width="100%" divider={<Divider orientation="horizontal" flexItem />} {...props}>
      <TableVirtuoso
        style={{ height: '70vh', width: '100%' }}
        data={metricNames}
        itemContent={(_, metricName) => <MetricRow metricName={metricName} datasource={datasource} filters={filters} />}
      />
    </Stack>
  );
}
