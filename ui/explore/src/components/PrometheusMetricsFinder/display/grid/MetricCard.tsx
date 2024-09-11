import { Box, Button, Card, CardContent, CardHeader, CardProps, Stack, StackProps, Typography } from '@mui/material';
import { DatasourceSelector } from '@perses-dev/core';
import useResizeObserver from 'use-resize-observer';
import { useInView } from 'react-intersection-observer';
import { DataQueriesProvider, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { Panel } from '@perses-dev/dashboards';
import { useMemo, useState } from 'react';
import EyeOutlineIcon from 'mdi-material-ui/EyeOutline';
import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import CompassIcon from 'mdi-material-ui/Compass';
import { encodeQueryData } from '../../utils';
import { computeFilterExpr, LabelFilter } from '../../types';

export interface HiddenMetricCardPanelProps extends CardProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  onExplore: (metricName: string) => void;
  onShowPanel: () => void;
}

export function HiddenMetricCardPanel({
  metricName,
  datasource,
  filters,
  onExplore,
  onShowPanel,
  ...props
}: HiddenMetricCardPanelProps) {
  const searchParams = useMemo(() => {
    return encodeQueryData({
      datasource,
      filters,
      exploredMetric: metricName,
    });
  }, [datasource, filters, metricName]);

  return (
    <Card
      component="section"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexFlow: 'column nowrap',
      }}
      variant="outlined"
      {...props}
    >
      <CardHeader
        component="header"
        disableTypography
        title={
          <Stack direction="row">
            <Typography
              variant="subtitle1"
              sx={{
                // `minHeight` guarantees that the header has the correct height
                // when there is no title (i.e. in the preview)
                lineHeight: '24px',
                minHeight: '24px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {metricName}
            </Typography>
          </Stack>
        }
        sx={(theme) => ({
          padding: theme.spacing(1),
          borderBottom: `solid 1px ${theme.palette.divider}`,
          '.MuiCardHeader-content': {
            overflow: 'hidden',
          },
          '.MuiCardHeader-action': {
            margin: 'auto',
          },
        })}
      />
      <CardContent
        sx={{
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Button
          aria-label="show panel"
          variant="contained"
          size="large"
          startIcon={<EyeOutlineIcon />}
          onClick={onShowPanel}
        >
          Show panel
        </Button>
        <Button
          aria-label={`explore metric ${metricName}`}
          variant="contained"
          size="large"
          startIcon={<CompassIcon />}
          onClick={() => onExplore(metricName)}
          component={RouterLink}
          to={`?${searchParams}`}
        >
          Explore metric
        </Button>
      </CardContent>
    </Card>
  );
}

export interface MetricCardPanelProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  onExplore: (metricName: string) => void;
}

export function MetricCardPanel({ metricName, datasource, filters, onExplore, ...props }: MetricCardPanelProps) {
  const { width, ref: firstBoxRef } = useResizeObserver();
  const suggestedStepMs = useSuggestedStepMs(width);

  const { ref: secondBoxRef, inView } = useInView({
    threshold: 0.2, // we have the flexibility to adjust this threshold to trigger queries slightly earlier or later based on performance
    initialInView: false,
    triggerOnce: true,
  });

  const queries = [
    {
      kind: 'TimeSeriesQuery',
      spec: {
        plugin: {
          kind: 'PrometheusTimeSeriesQuery',
          spec: {
            datasource: datasource,
            query: `{__name__="${metricName}", ${computeFilterExpr(filters)}}`,
          },
        },
      },
    },
  ];

  const definitions = queries.map((query) => {
    return {
      kind: query.spec.plugin.kind,
      spec: query.spec.plugin.spec,
    };
  });

  const searchParams = useMemo(() => {
    return encodeQueryData({
      datasource,
      filters,
      exploredMetric: metricName,
    });
  }, [datasource, filters, metricName]);

  return (
    <Box ref={firstBoxRef} sx={{ width: '100%', height: '100%' }} {...props}>
      <Box ref={secondBoxRef} sx={{ width: '100%', height: '100%' }}>
        <DataQueriesProvider
          definitions={definitions}
          options={{ suggestedStepMs, mode: 'range' }}
          queryOptions={{ enabled: inView }}
        >
          {inView && (
            <Panel
              panelOptions={{
                hideHeader: false,
              }}
              customActions={
                <Button
                  size="small"
                  aria-label={`explore metric ${metricName}`}
                  variant="contained"
                  startIcon={<CompassIcon />}
                  style={{ textWrap: 'nowrap' }}
                  onClick={() => onExplore(metricName)}
                  component={RouterLink}
                  to={`?${searchParams}`}
                >
                  Explore
                </Button>
              }
              definition={{
                kind: 'Panel',
                spec: {
                  queries: queries,
                  display: { name: metricName, description: 'TODO' },
                  plugin: { kind: 'TimeSeriesChart', spec: {} },
                },
              }}
            />
          )}
        </DataQueriesProvider>
      </Box>
    </Box>
  );
}

export interface MetricCardProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
  showPanel?: boolean;
  onExplore: (metricName: string) => void;
}

export function MetricCard({ metricName, datasource, filters, showPanel, onExplore, ...props }: MetricCardProps) {
  const [isPanelEnabled, setIsPanelEnabled] = useState(showPanel ?? true);

  return (
    <Stack {...props}>
      {isPanelEnabled ? (
        <MetricCardPanel metricName={metricName} datasource={datasource} filters={filters} onExplore={onExplore} />
      ) : (
        <HiddenMetricCardPanel
          metricName={metricName}
          datasource={datasource}
          filters={filters}
          onExplore={onExplore}
          onShowPanel={() => setIsPanelEnabled(true)}
        />
      )}
    </Stack>
  );
}
