// Copyright 2022 The Perses Authors
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

import { useMemo } from 'react';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { FocusedSeriesArray } from './focused-series';
import { SeriesInfo } from './SeriesInfo';

interface TooltipContentProps {
  focusedSeries: FocusedSeriesArray | null;
  wrapLabels?: boolean;
}

export function TooltipContent(props: TooltipContentProps) {
  const { focusedSeries, wrapLabels } = props;

  const seriesTime = focusedSeries && focusedSeries[0] && focusedSeries[0].date ? focusedSeries[0].date : null;

  const formatTimeSeriesHeader = (timeString: string) => {
    const [month, year, time] = timeString.split(',');
    return (
      <>
        <Typography
          variant="caption"
          sx={(theme) => ({
            color: theme.palette.common.white,
          })}
        >
          {month}, {year} –
        </Typography>
        <Typography variant="caption">
          <strong>{time}</strong>
        </Typography>
      </>
    );
  };

  const sortedFocusedSeries = useMemo(() => {
    if (focusedSeries === null) return null;
    return focusedSeries.sort((a, b) => (a.y > b.y ? -1 : 1));
  }, [focusedSeries]);

  if (sortedFocusedSeries !== null && seriesTime !== null) {
    return (
      <Stack py={1} px={1.5} spacing={0.5}>
        <Typography variant="caption">{formatTimeSeriesHeader(seriesTime)}</Typography>
        <Divider
          sx={(theme) => ({
            borderColor: theme.palette.grey['500'],
          })}
        />
        <Box
          sx={{
            display: 'table',
          }}
        >
          {sortedFocusedSeries.map(({ datumIdx, seriesIdx, seriesName, seriesType, y, formattedY, markerColor }) => {
            if (datumIdx === null || seriesIdx === null) return null;
            const key = seriesIdx.toString() + datumIdx.toString();

            if (seriesType === 'scatter') {
              return (
                <section>
                  <h2>Scatter Series Component Goes Here</h2>
                </section>
              );
            }
            return (
              <SeriesInfo
                key={key}
                seriesName={seriesName}
                y={y}
                formattedY={formattedY}
                markerColor={markerColor}
                totalSeries={sortedFocusedSeries.length}
                wrapLabels={wrapLabels}
              />
            );
          })}
        </Box>
      </Stack>
    );
  } else {
    return <></>;
  }
}
