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

import { useState } from 'react';
import { Box } from '@mui/material';
import { Virtuoso } from 'react-virtuoso';
import { TooltipContentProps } from './TooltipContent';
import { SeriesInfo } from './SeriesInfo';

export interface VirtualizedSeriesProps {
  allowActions: TooltipContentProps['allowActions'];
  wrapLabels: TooltipContentProps['wrapLabels'];
  onSelected?: TooltipContentProps['onSelected'];
  sortedFocusedSeries: NonNullable<TooltipContentProps['series']>;
}

// LOGZ.IO CHANGE FILE:: Performance optimization [APPZ-359]

export const VirtualizedSeries: React.FC<VirtualizedSeriesProps> = ({
  allowActions,
  sortedFocusedSeries,
  wrapLabels,
  onSelected,
}) => {
  const [height, setHeight] = useState(10);
  return (
    <Box
      sx={(theme) => ({
        padding: theme.spacing(0.5, 2),
        // LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
        borderBottom: allowActions ? `1px solid ${theme.palette.divider}` : undefined,
        // LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
      })}
    >
      <Virtuoso
        role="list"
        style={{ height: height > 300 ? 300 : height, width: '100%' }}
        totalListHeightChanged={setHeight}
        totalCount={sortedFocusedSeries.length}
        data={sortedFocusedSeries}
        itemContent={(index, data) => {
          if (!data.datumIdx || !data.seriesIdx) return null;

          const key = data.seriesIdx.toString() + data.datumIdx.toString();

          return (
            <SeriesInfo
              key={key}
              seriesName={data.seriesName}
              y={data.y}
              formattedY={data.formattedY}
              markerColor={data.markerColor}
              totalSeries={sortedFocusedSeries.length}
              wrapLabels={wrapLabels}
              emphasizeText={data.isClosestToCursor}
              // LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
              isSelected={data.isSelected}
              isSelectable={data.metadata?.isSelectable ?? true}
              onSelected={onSelected ? (): void => onSelected(data.seriesIdx!) : undefined}
              // LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
            />
          );
        }}
      />
    </Box>
  );
};
