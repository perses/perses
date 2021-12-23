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

import { Box, Typography } from '@mui/material';
import { FocusedSeriesArray } from './tooltip-model';
import SeriesInfo from './SeriesInfo';

function TooltipContent(props: { focusedSeries: FocusedSeriesArray }) {
  const { focusedSeries } = props;
  return (
    <>
      {focusedSeries.map(({ datumIdx, seriesIdx, seriesName, date, y, markerColor }) => {
        if (datumIdx === null || seriesIdx === null) return null;
        const key = seriesIdx.toString() + datumIdx.toString();
        return (
          <Box key={key} sx={{ padding: '5px 10px' }}>
            <Typography variant="body2" sx={{ mb: '2px' }}>
              {date}
            </Typography>
            <SeriesInfo seriesName={seriesName} y={y} markerColor={markerColor} totalSeries={focusedSeries.length} />
          </Box>
        );
      })}
    </>
  );
}

export default TooltipContent;
