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
import SeriesMarker from './SeriesMarker';
// import { TOOLTIP_MIN_WIDTH } from './tooltip-model';

interface SeriesInfoProps {
  seriesName: string;
  y: number;
  markerColor: string;
  totalSeries: number;
}

function SeriesInfo(props: SeriesInfoProps) {
  const { seriesName, y, markerColor, totalSeries } = props;
  if (totalSeries === 1) {
    const namesArr = seriesName.split(',');
    return (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <SeriesMarker markerColor={markerColor} />
          <Box>value: {y}</Box>
        </Box>
        <Box sx={{ m: '5px 0' }}>
          {namesArr.map((value, idx) => {
            return (
              <Typography key={idx} sx={{ m: '0 0 4px', fontSize: '11px' }}>
                {value}
              </Typography>
            );
          })}
        </Box>
      </>
    );
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <SeriesMarker markerColor={markerColor} />
      <Box component="span" sx={{ mr: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {seriesName}
      </Box>
      <Box>{y}</Box>
    </Box>
  );
}

export default SeriesInfo;
