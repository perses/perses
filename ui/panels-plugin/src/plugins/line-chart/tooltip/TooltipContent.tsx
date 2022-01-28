// Copyright 2021 The Perses Authors
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

import { Box, Divider, Stack, Typography } from '@mui/material';
import { FocusedSeriesArray } from '../utils/focused-series';
import SeriesInfo from './SeriesInfo';

function TooltipContent(props: { focusedSeries: FocusedSeriesArray; wrapLabels?: boolean }) {
  const { focusedSeries, wrapLabels } = props;
  // let lastDate = focusedSeries[0] && focusedSeries[0].date ? focusedSeries[0].date : '';
  const seriesTime = focusedSeries[0] && focusedSeries[0].date ? focusedSeries[0].date : false;

  const formatTimeSeriesHeader = (timeString: string) => {
    console.log('time string is', timeString);
    const [month, year, time] = timeString.split(',');
    return (
      <>
        <Typography variant="caption" color="grey.300">
          {month}, {year} –
        </Typography>
        <Typography variant="caption">
          <strong>{time}</strong>
        </Typography>
      </>
    );
  };

  return (
    <Stack py={1} px={1.5} spacing={0.5}>
      {seriesTime && <Typography variant="caption">{formatTimeSeriesHeader(seriesTime)}</Typography>}
      <Divider sx={{ borderColor: 'grey.800' }} />
      <Box
        sx={{
          display: 'table',
        }}
      >
        {focusedSeries.map(({ datumIdx, seriesIdx, seriesName, y, markerColor }) => {
          if (datumIdx === null || seriesIdx === null) return null;
          const key = seriesIdx.toString() + datumIdx.toString();

          // if (index === 0 || date !== lastDate) {
          //   lastDate = date;
          //   return (
          //     <SeriesInfo key={key} seriesName={seriesName} y={y} markerColor={markerColor} totalSeries={focusedSeries.length} />
          //   );
          // }

          // lastDate = date;
          return (
            <SeriesInfo
              key={key}
              seriesName={seriesName}
              y={y}
              markerColor={markerColor}
              totalSeries={focusedSeries.length}
              wrapLabels={wrapLabels}
            />
          );
        })}
      </Box>
    </Stack>
  );
}

export default TooltipContent;
