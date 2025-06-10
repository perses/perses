// Copyright 2025 The Perses Authors
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

import { CardHeader, CardHeaderProps, Stack, Typography } from '@mui/material';
import { combineSx } from '@perses-dev/components';
import { Link, TimeSeriesData, TimeSeries, TimeSeriesMetadata } from '@perses-dev/core';
import { QueryData, useReplaceVariablesInString } from '@perses-dev/plugin-system';
import { ReactElement, ReactNode, useMemo } from 'react';
import { HEADER_ACTIONS_CONTAINER_NAME } from '../../constants';
import { PanelActions, PanelActionsProps } from './PanelActions';

type OmittedProps = 'children' | 'action' | 'title' | 'disableTypography';

interface AbsoluteTimeRange {
  start: Date;
  end: Date;
}

export interface PanelHeaderProps extends Omit<CardHeaderProps, OmittedProps> {
  id: string;
  title: string;
  description?: string;
  links?: Link[];
  extra?: ReactNode;
  queryResults: QueryData[];
  readHandlers?: PanelActionsProps['readHandlers'];
  editHandlers?: PanelActionsProps['editHandlers'];
  projectName?: string;
}

export function PanelHeader({
  id,
  title: rawTitle,
  description: rawDescription,
  links,
  queryResults,
  readHandlers,
  editHandlers,
  sx,
  extra,
  projectName,
  ...rest
}: PanelHeaderProps): ReactElement {
  const titleElementId = `${id}-title`;
  const descriptionTooltipId = `${id}-description`;

  const title = useReplaceVariablesInString(rawTitle) as string;
  const description = useReplaceVariablesInString(rawDescription);

  const timeSeriesDataForExport = useMemo(() => {
    // Collect all series from all queries
    const allSeries: TimeSeries[] = [];
    let timeRange: AbsoluteTimeRange | undefined = undefined;
    let stepMs: number | undefined = undefined;
    let metadata: TimeSeriesMetadata | undefined = undefined;

    queryResults.forEach((query) => {
      if (query.data && 'series' in query.data) {
        const timeSeriesData = query.data as TimeSeriesData;

        // Collect series from this query
        if (timeSeriesData.series && timeSeriesData.series.length > 0) {
          allSeries.push(...timeSeriesData.series);

          // Use the first query's metadata/timeRange/stepMs as the base
          if (!timeRange && timeSeriesData.timeRange) {
            timeRange = timeSeriesData.timeRange;
          }
          if (!stepMs && timeSeriesData.stepMs) {
            stepMs = timeSeriesData.stepMs;
          }
          if (!metadata && timeSeriesData.metadata) {
            metadata = timeSeriesData.metadata;
          }
        }
      }
    });

    // If we found series, create a combined TimeSeriesData object
    if (allSeries.length > 0) {
      const combinedData: TimeSeriesData = {
        series: allSeries,
        timeRange,
        stepMs,
        metadata,
      };

      return combinedData;
    }

    return undefined;
  }, [queryResults]);

  return (
    <CardHeader
      id={id}
      component="header"
      aria-labelledby={titleElementId}
      aria-describedby={descriptionTooltipId}
      disableTypography
      title={
        <Stack direction="row">
          <Typography
            id={titleElementId}
            variant="subtitle1"
            sx={{
              // `minHeight` guarantees that the header has the correct height
              // when there is no title (i.e. in the preview)
              lineHeight: '24px',
              minHeight: '26px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </Typography>
          <PanelActions
            title={title}
            description={description}
            descriptionTooltipId={descriptionTooltipId}
            links={links}
            queryResults={timeSeriesDataForExport}
            readHandlers={readHandlers}
            editHandlers={editHandlers}
            extra={extra}
            projectName={projectName}
          />
        </Stack>
      }
      sx={combineSx(
        (theme) => ({
          containerType: 'inline-size',
          containerName: HEADER_ACTIONS_CONTAINER_NAME,
          padding: theme.spacing(1),
          borderBottom: `solid 1px ${theme.palette.divider}`,
          '.MuiCardHeader-content': {
            overflow: 'hidden',
          },
        }),
        sx
      )}
      {...rest}
    />
  );
}
