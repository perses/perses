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

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Stack,
  StackProps,
  Typography,
} from '@mui/material';
import { DatasourceSelector, PanelDefinition } from '@perses-dev/core';
import useResizeObserver from 'use-resize-observer';
import { useInView } from 'react-intersection-observer';
import { DataQueriesProvider, useSuggestedStepMs } from '@perses-dev/plugin-system';
import { useMemo, useState } from 'react';
import EyeOutlineIcon from 'mdi-material-ui/EyeOutline';
import * as React from 'react';
import { combineSx, ErrorAlert, ErrorBoundary, InfoTooltip } from '@perses-dev/components';
import { PanelContent } from '@perses-dev/dashboards/dist/components/Panel/PanelContent';
import { HeaderActionWrapper, HeaderIconButton } from '@perses-dev/dashboards/dist/components/Panel/PanelHeader';
import CompassIcon from 'mdi-material-ui/Compass';
import { Link as RouterLink } from 'react-router-dom';
import InformationOutlineIcon from 'mdi-material-ui/InformationOutline';
import { computeFilterExpr, LabelFilter } from '../../types';
import { encodeQueryData, useMetricMetadata } from '../../utils';

export interface MetricCardPanelProps extends StackProps {
  metricName: string;
  datasource: DatasourceSelector;
  filters: LabelFilter[];
}

export function MetricCardPanel({ metricName, datasource, filters, ...props }: MetricCardPanelProps) {
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

  const definition: PanelDefinition = {
    kind: 'Panel',
    spec: {
      queries: queries,
      display: { name: metricName, description: 'TODO' },
      plugin: { kind: 'TimeSeriesChart', spec: {} },
    },
  };

  return (
    <Box ref={firstBoxRef} sx={{ width: '100%', height: '100%' }} {...props}>
      <Box ref={secondBoxRef} sx={{ width: '100%', height: '100%' }}>
        <DataQueriesProvider
          definitions={definitions}
          options={{ suggestedStepMs, mode: 'range' }}
          queryOptions={{ enabled: inView }}
        >
          {inView && (
            <ErrorBoundary FallbackComponent={ErrorAlert} resetKeys={[definition.spec]}>
              <PanelContent
                definition={definition}
                panelPluginKind={definition.spec.plugin.kind}
                spec={definition.spec.plugin.spec}
                contentDimensions={{ width: width ?? 200, height: 210 }}
              />
            </ErrorBoundary>
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

export function MetricCard({ metricName, datasource, filters, showPanel, onExplore, sx, ...props }: MetricCardProps) {
  const [isPanelEnabled, setIsPanelEnabled] = useState(showPanel ?? true);

  const { metadata, isLoading } = useMetricMetadata(metricName, datasource, isPanelEnabled);

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
      sx={combineSx(
        {
          width: '100%',
          display: 'flex',
          flexFlow: 'column nowrap',
          height: '250px',
        },
        sx
      )}
      variant="outlined"
      {...props}
    >
      <CardHeader
        component="header"
        disableTypography
        title={
          <Stack direction="row" height="100%" gap={1}>
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
            {isPanelEnabled && isLoading && (
              <Stack height={24} alignItems="center">
                <CircularProgress size={24} aria-label="loading" />
              </Stack>
            )}
            {metadata?.help && (
              <InfoTooltip description={metadata.help} enterDelay={100}>
                <HeaderIconButton aria-label="metric description" size="small">
                  <InformationOutlineIcon
                    aria-describedby="info-tooltip"
                    aria-hidden={false}
                    fontSize="inherit"
                    sx={{ color: (theme) => theme.palette.text.secondary }}
                  />
                </HeaderIconButton>
              </InfoTooltip>
            )}
          </Stack>
        }
        action={
          <HeaderActionWrapper direction="row" alignItems="center">
            <Button
              size="small"
              aria-label={`explore metric ${metricName}`}
              variant="contained"
              startIcon={<CompassIcon />}
              style={{ textWrap: 'nowrap' }}
              // onClick={() => onExplore(metricName)}
              component={RouterLink}
              to={`?${searchParams}`}
            >
              Explore
            </Button>
          </HeaderActionWrapper>
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
          padding: 0,
        }}
      >
        {isPanelEnabled ? (
          <MetricCardPanel metricName={metricName} datasource={datasource} filters={filters} />
        ) : (
          <Button
            aria-label="show panel"
            variant="contained"
            size="large"
            startIcon={<EyeOutlineIcon />}
            onClick={() => setIsPanelEnabled(true)}
          >
            Show panel
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
