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

import { ReactElement, cloneElement } from 'react';
import { Box, Typography } from '@mui/material';
import { NearbySeriesArray } from './nearby-series';
import { SeriesInfo } from './SeriesInfo';
import { getTooltipStyles } from './utils';

export type TooltipConfig = {
  wrapLabels: boolean;
  hidden?: boolean;
  plugin?: TooltipPluginProps;
};

export interface TooltipPluginProps {
  seriesTypeTrigger: string;
  tooltipOverride?: ReactElement;
}

export interface TooltipPluginContentProps {
  tooltipOverride?: ReactElement;
  series: NearbySeriesArray | null;
  cursorTransform: string;
}

export function TooltipPluginContent({ tooltipOverride, series, cursorTransform }: TooltipPluginContentProps) {
  if (series === null || series.length === 0) {
    return null;
  }

  if (tooltipOverride) {
    // If consumer provides tooltip plugin content, inherit existing props but pass correct series and transform data
    return cloneElement(tooltipOverride, { series, cursorTransform });
  }

  // Fallback to default scatter tooltip plugin
  return (
    <Box
      sx={(theme) => getTooltipStyles(theme)}
      style={{
        transform: cursorTransform,
      }}
    >
      {series.map(({ datumIdx, seriesIdx, seriesName, y, formattedY, markerColor, isClosestToCursor }) => {
        if (datumIdx === null || seriesIdx === null) return null;
        const key = seriesIdx.toString() + datumIdx.toString();

        return (
          <Box key={key}>
            <Typography>Default Scatter Tooltip</Typography>
            <SeriesInfo
              key={key}
              seriesName={seriesName}
              y={y}
              formattedY={formattedY}
              markerColor={markerColor}
              totalSeries={series.length}
              wrapLabels={true}
              emphasizeText={isClosestToCursor}
            />
          </Box>
        );
      })}
    </Box>
  );
}
