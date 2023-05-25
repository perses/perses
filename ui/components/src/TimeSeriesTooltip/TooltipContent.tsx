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
import { Virtuoso } from 'react-virtuoso';
import { Box, useTheme } from '@mui/material';
import { NearbySeriesArray } from './nearby-series';
import { SeriesInfo } from './SeriesInfo';
import { APPROX_SERIES_HEIGHT, TOOLTIP_MAX_HEIGHT, TOOLTIP_MULTI_SERIES_MIN_WIDTH } from './tooltip-model';

export interface TooltipContentProps {
  series: NearbySeriesArray | null;
  wrapLabels?: boolean;
}

export function TooltipContent(props: TooltipContentProps) {
  const { series, wrapLabels } = props;

  const theme = useTheme();

  const sortedFocusedSeries = useMemo(() => {
    if (series === null) return null;
    return series.sort((a, b) => (a.y > b.y ? -1 : 1));
  }, [series]);

  if (series === null || sortedFocusedSeries === null) {
    return null;
  }
  const totalSeries = series.length;

  if (totalSeries === 1) {
    const [seriesData] = series;
    if (seriesData === undefined) {
      return null;
    }
    const { seriesName, y, formattedY, markerColor, isClosestToCursor } = seriesData;
    return (
      <SeriesInfo
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

  // TODO: is there a better way to approximate height or a dynamic height and width workaround for Virtuoso?
  // Need to roughly estimate height based on number of series for react-virtuoso
  const contentHeight = Math.min(TOOLTIP_MAX_HEIGHT, totalSeries * APPROX_SERIES_HEIGHT);

  // Padding value used in the react virtuoso header/footer components to
  // simulate top/bottom padding based on recommendation in this issue.
  // https://github.com/petyosi/react-virtuoso/issues/238
  const LIST_PADDING = parseInt(theme.spacing(0.5), 10);
  const mockPadding = <Box sx={{ width: '100%', height: `${LIST_PADDING}px` }}></Box>;

  return (
    <Virtuoso
      style={{ height: contentHeight, width: TOOLTIP_MULTI_SERIES_MIN_WIDTH }}
      data={sortedFocusedSeries}
      totalCount={totalSeries}
      overscan={50}
      itemContent={(index, item) => {
        return (
          <SeriesInfo
            key={item.seriesIdx}
            seriesName={item.seriesName}
            y={item.y}
            formattedY={item.formattedY}
            markerColor={item.markerColor}
            totalSeries={totalSeries}
            wrapLabels={wrapLabels}
            emphasizeText={item.isClosestToCursor}
          />
        );
      }}
      role="list"
      components={{
        Header: () => {
          return mockPadding;
        },
        Footer: () => {
          return mockPadding;
        },
      }}
    />
  );
}
