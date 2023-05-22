// Copyright 2023 The Perses Authors
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
import PinOutline from 'mdi-material-ui/PinOutline';
import Pin from 'mdi-material-ui/Pin';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { useTimeZone } from '../context/TimeZoneProvider';
import { FocusedSeriesArray } from './focused-series';
import { SeriesInfo } from './SeriesInfo';

export interface TooltipContentProps {
  focusedSeries: FocusedSeriesArray | null;
  tooltipPinned: boolean;
  wrapLabels?: boolean;
  onUnpinClick: () => void;
}

export function TooltipContent(props: TooltipContentProps) {
  const { focusedSeries, wrapLabels, tooltipPinned, onUnpinClick } = props;
  const { formatWithUserTimeZone } = useTimeZone();

  const seriesTime = focusedSeries && focusedSeries[0] && focusedSeries[0].date ? focusedSeries[0].date : null;

  const formatTimeSeriesHeader = (timeMs: number) => {
    const date = new Date(timeMs);
    const formattedDate = formatWithUserTimeZone(date, 'MMM dd, yyyy - ');
    const formattedTime = formatWithUserTimeZone(date, 'HH:mm:ss');
    return (
      <Box>
        <Typography
          variant="caption"
          sx={(theme) => ({
            color: theme.palette.common.white,
          })}
        >
          {formattedDate}
        </Typography>
        <Typography variant="caption">
          <strong>{formattedTime}</strong>
        </Typography>
      </Box>
    );
  };

  const sortedFocusedSeries = useMemo(() => {
    if (focusedSeries === null) return null;
    return focusedSeries.sort((a, b) => (a.y > b.y ? -1 : 1));
  }, [focusedSeries]);

  if (sortedFocusedSeries === null || seriesTime === null) {
    return null;
  }

  // TODO: use react-virtuoso to improve performance
  return (
    <Stack py={1} spacing={0.5}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'start',
          alignItems: 'center',
        }}
      >
        {formatTimeSeriesHeader(seriesTime)}
        <Stack direction="row" gap={1} sx={{ marginLeft: 'auto' }}>
          <Typography sx={{ fontSize: 11 }}>Click to {tooltipPinned ? 'Unpin' : 'Pin'}</Typography>
          {tooltipPinned ? (
            <Pin onClick={onUnpinClick} sx={{ fontSize: 16, cursor: 'pointer' }} />
          ) : (
            <PinOutline sx={{ fontSize: 16 }} />
          )}
        </Stack>
      </Box>

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
        {sortedFocusedSeries.map(
          ({ datumIdx, seriesIdx, seriesName, y, formattedY, markerColor, isClosestToCursor }) => {
            if (datumIdx === null || seriesIdx === null) return null;
            const key = seriesIdx.toString() + datumIdx.toString();

            return (
              <SeriesInfo
                key={key}
                seriesName={seriesName}
                y={y}
                formattedY={formattedY}
                markerColor={markerColor}
                totalSeries={sortedFocusedSeries.length}
                wrapLabels={wrapLabels}
                emphasizeText={isClosestToCursor}
              />
            );
          }
        )}
      </Box>
    </Stack>
  );
}
