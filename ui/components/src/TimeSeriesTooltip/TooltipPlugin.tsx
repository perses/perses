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
import { Box } from '@mui/material';
import { NearbySeriesArray } from './nearby-series';
import { SeriesInfo } from './SeriesInfo';

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
  nearbySeries?: NearbySeriesArray | null;
}

export function TooltipPluginContent({ tooltipOverride, nearbySeries }: TooltipPluginContentProps) {
  if (!nearbySeries) {
    return null;
  }

  if (tooltipOverride) {
    // If consumer provides tooltip plugin content, inherit existing props but pass correct series and transform data
    return cloneElement(tooltipOverride, { nearbySeries });
  }

  // Fallback to default tooltip plugin content
  return (
    <Box>
      {nearbySeries.map(({ datumIdx, seriesIdx, seriesName, y, formattedY, markerColor, isClosestToCursor }) => {
        if (datumIdx === null || seriesIdx === null) return null;
        const key = seriesIdx.toString() + datumIdx.toString();
        return (
          <Box key={key}>
            <SeriesInfo
              key={key}
              seriesName={seriesName}
              y={y}
              formattedY={formattedY}
              markerColor={markerColor}
              totalSeries={nearbySeries.length}
              wrapLabels={true}
              emphasizeText={isClosestToCursor}
            />
          </Box>
        );
      })}
    </Box>
  );
}
