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

import { Box, Theme } from '@mui/material';
import { SxProps } from '@mui/system/styleFunctionSx/styleFunctionSx';
import SeriesMarker from './SeriesMarker';

const seriesNameStyle: SxProps<Theme> = {
  marginRight: '4px',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
};

interface SeriesInfoProps {
  seriesName: string;
  y: number;
  markerColor: string;
  totalSeries: number;
}

function SeriesInfo(props: SeriesInfoProps) {
  const { seriesName, y, markerColor } = props;
  // TODO (sjcobb): regex to remove __name__ and quotes
  const formattedSeriesName = seriesName.replaceAll('=', ': ');
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
      <SeriesMarker markerColor={markerColor} />
      <Box
        component="span"
        sx={{
          ...seriesNameStyle,
          '&:hover': {
            overflow: 'visible',
            whiteSpace: 'normal',
          },
        }}
      >
        {formattedSeriesName}
      </Box>
      <Box>{y}</Box>
    </Box>
  );
}

export default SeriesInfo;
