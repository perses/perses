import { DatasourceSelector } from '@perses-dev/core';
import { useDatasourceClient } from '@perses-dev/plugin-system';
import {
  MetricMetadata,
  MetricMetadataRequestParameters,
  MetricMetadataResponse,
  PrometheusClient,
  SeriesRequestParameters,
  SeriesResponse,
} from '@perses-dev/prometheus-plugin';
import { useQuery } from '@tanstack/react-query';
import { Fragment, useMemo } from 'react';
import { Divider, Stack, StackProps, Typography } from '@mui/material';
import * as React from 'react';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import { MetricChip } from '../../display/list/MetricList';
import { computeFilterExpr, LabelFilter } from '../../types';

export function useSeriesStates(datasource: DatasourceSelector, metricName: string, filters: LabelFilter[]) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data: seriesData, isLoading } = useQuery<SeriesResponse>({
    enabled: !!client,
    queryKey: ['series', metricName],
    queryFn: async () => {
      const params: SeriesRequestParameters = { 'match[]': [`{${computeFilterExpr(filters)}}`] };

      return await client!.series(params);
    },
  });

  const labelValueCounters: Map<string, Array<{ labelValue: string; counter: number }>> = useMemo(() => {
    const result = new Map<string, Array<{ labelValue: string; counter: number }>>();
    if (seriesData?.data === undefined) {
      return result;
    }

    for (const series of seriesData.data) {
      for (const [label, value] of Object.entries(series)) {
        const labelCounters = result.get(label);
        if (labelCounters === undefined) {
          result.set(label, [{ labelValue: value, counter: 1 }]);
          continue;
        }

        const labelValueCounter = labelCounters.find((counter) => counter.labelValue === value);
        if (labelValueCounter === undefined) {
          labelCounters.push({ labelValue: value, counter: 1 });
        } else {
          labelValueCounter.counter += 1;
        }
      }
    }

    return result;
  }, [seriesData]);

  return { series: seriesData?.data, labelValueCounters, isLoading };
}

export interface OverviewTabProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
}

export function OverviewTab({ metricName, datasource, filters, ...props }: OverviewTabProps) {
  const { data: client } = useDatasourceClient<PrometheusClient>(datasource);

  const { data: metricData, isLoading: isMetricLoading } = useQuery<MetricMetadataResponse>({
    enabled: !!client,
    queryKey: ['metricMetadata', metricName],
    queryFn: async () => {
      const params: MetricMetadataRequestParameters = { metric: metricName };

      return await client!.metricMetadata(params);
    },
  });

  const metadata: MetricMetadata | undefined = useMemo(() => {
    return metricData?.data?.[metricName]?.[0];
  }, [metricData, metricName]);

  const { series, labelValueCounters, isLoading } = useSeriesStates(datasource, metricName, filters);

  const labels: string[] = useMemo(() => {
    return [...labelValueCounters.keys()];
  }, [labelValueCounters]);

  return (
    <Stack gap={2} {...props}>
      <Stack direction="row" alignItems="center" gap={3} mt={1} justifyContent="space-between">
        <Stack gap={1}>
          <Typography variant="h1" sx={{ fontFamily: 'monospace' }}>
            {metricName}
          </Typography>
          <Typography>
            Description: <span style={{ fontWeight: 'bold' }}>{metadata?.help ?? 'unknown'}</span> {/* TODO loading */}
          </Typography>
        </Stack>
        <Stack gap={1}>
          <MetricChip label={metadata ? metadata.type : 'unknown'} />
          <Typography>
            Series total: <span style={{ fontWeight: 'bold' }}>{series?.length ?? 'Loading'}</span>
          </Typography>
        </Stack>
      </Stack>
      <Stack divider={<Divider flexItem orientation="horizontal" />} gap={2}>
        <Typography variant="h2">Labels</Typography>
        <Grid container spacing={2}>
          {labels.map((label) => (
            <Fragment key={label}>
              <Grid xs={6}>
                <Stack alignItems="center">
                  <Typography sx={{ fontFamily: 'monospace' }}>{label}</Typography>
                </Stack>
              </Grid>
              <Grid xs={6}>
                <Typography>{labelValueCounters.get(label)?.length ?? 0} values</Typography>
                <Stack>
                  {(labelValueCounters.get(label) ?? []).map((labelValueCounter) => (
                    <Stack
                      key={`${label}-${labelValueCounter.labelValue}`}
                      direction="row"
                      gap={2}
                      justifyContent="space-between"
                    >
                      <Typography sx={{ fontFamily: 'monospace' }}>{labelValueCounter.labelValue}</Typography>
                      <Typography>({labelValueCounter.counter} series)</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Grid>
            </Fragment>
          ))}
        </Grid>
      </Stack>
    </Stack>
  );
}
